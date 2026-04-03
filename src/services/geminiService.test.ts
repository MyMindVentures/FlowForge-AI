import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateSuggestions, 
  generateFeatureDetails, 
  generateReleaseNotes, 
  generateProjectDocumentation, 
  generateMarketingKit, 
  generateAssetTags 
} from './geminiService';

// Mock Firebase
vi.mock('../lib/supabase/appClient', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id', providerData: [] }
  },
  supabase: {}
}));

vi.mock('../lib/db/supabaseData', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn()
}));

// Mock GoogleGenAI
const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn()
}));

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function() {
      return {
        models: {
          generateContent: mockGenerateContent
        }
      };
    }),
    Type: {
      OBJECT: 'OBJECT',
      ARRAY: 'ARRAY',
      STRING: 'STRING'
    }
  };
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const projectContext = { id: 'p1', name: 'Test Project', description: 'Test Desc' } as any;

  describe('generateSuggestions', () => {
    it('calls the AI model and returns parsed suggestions', async () => {
      const mockSuggestions = [
        { title: 'Feature 1', problem: 'P1', solution: 'S1', userValue: 'V1', scope: 'Small' },
        { title: 'Feature 2', problem: 'P2', solution: 'S2', userValue: 'V2', scope: 'Medium' },
        { title: 'Feature 3', problem: 'P3', solution: 'S3', userValue: 'V3', scope: 'Large' },
        { title: 'Feature 4', problem: 'P4', solution: 'S4', userValue: 'V4', scope: 'Small' },
        { title: 'Feature 5', problem: 'P5', solution: 'S5', userValue: 'V5', scope: 'Medium' }
      ];

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockSuggestions)
      });

      const result = await generateSuggestions('test prompt', projectContext);

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toEqual(mockSuggestions);
      expect(result).toHaveLength(5);
    });

    it('handles invalid JSON response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Invalid JSON' });
      const result = await generateSuggestions('test', projectContext);
      expect(result).toEqual([]);
    });

    it('handles existing features', async () => {
      mockGenerateContent.mockResolvedValue({ text: '[]' });
      const existingFeatures = [{ title: 'Existing', nonTechnicalDescription: 'Desc' }] as any;
      
      await generateSuggestions('test', projectContext, existingFeatures);
      
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        contents: expect.stringContaining('Existing: Desc')
      }));
    });

    it('retries on failure', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('AI Error'))
        .mockResolvedValueOnce({
          text: JSON.stringify([{ title: 'Retry Success', problem: 'P', solution: 'S', userValue: 'V', scope: 'Small' }])
        });

      const result = await generateSuggestions('test prompt', projectContext);

      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(result[0].title).toBe('Retry Success');
    });

    it('throws error after max retries', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Persistent AI Error'));

      await expect(generateSuggestions('test prompt', projectContext)).rejects.toThrow('Persistent AI Error');
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateFeatureDetails', () => {
    it('returns feature details', async () => {
      const mockDetails = {
        problem: 'P', solution: 'S', why: 'W', 
        nonTechnicalDescription: 'NTD', technicalDescription: 'TD', 
        priority: 'High', comments: []
      };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockDetails) });

      const result = await generateFeatureDetails('p1', { title: 'F1' });
      expect(result).toEqual(mockDetails);
    });
  });

  describe('generateReleaseNotes', () => {
    it('returns release notes string', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Release Notes Content' });
      const result = await generateReleaseNotes('v1', 'Goal', [{ title: 'F1', nonTechnicalDescription: 'D1' }] as any);
      expect(result).toBe('Release Notes Content');
    });

    it('returns default string on empty response', async () => {
      mockGenerateContent.mockResolvedValue({ text: '' });
      const result = await generateReleaseNotes('v1', 'Goal', []);
      expect(result).toBe('Failed to generate release notes.');
    });
  });

  describe('generateProjectDocumentation', () => {
    it('returns documentation', async () => {
      const mockDocs = { prd: 'PRD', conceptSummary: 'Concept', tagline: 'Tagline' };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockDocs) });

      const features = [{ title: 'F1', nonTechnicalDescription: 'D1', status: 'Completed' }] as any;
      const result = await generateProjectDocumentation(projectContext, features);
      expect(result).toEqual(mockDocs);
    });
  });

  describe('generateMarketingKit', () => {
    it('returns marketing kit', async () => {
      const mockKit = { taglines: ['T1'], valuePropositions: [], pitchNarrative: 'Pitch', marketingCopy: [] };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockKit) });

      const result = await generateMarketingKit(projectContext, []);
      expect(result).toEqual(mockKit);
    });

    it('handles existing features', async () => {
      const mockKit = { taglines: ['T1'], valuePropositions: [], pitchNarrative: 'Pitch', marketingCopy: [] };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockKit) });

      const features = [{ title: 'F1', nonTechnicalDescription: 'D1' }] as any;
      const result = await generateMarketingKit(projectContext, features);
      expect(result).toEqual(mockKit);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        contents: expect.stringContaining('F1: D1')
      }));
    });
  });

  describe('logging errors', () => {
    it('handles logAIUsage error', async () => {
      const { addDoc } = await import('../lib/db/supabaseData');
      (addDoc as any).mockRejectedValueOnce(new Error('Firestore Error'));
      
      mockGenerateContent.mockResolvedValue({ text: '[]' });
      await generateSuggestions('test', projectContext);
      
      // Should not throw, just log error internally
      expect(addDoc).toHaveBeenCalled();
    });

    it('handles logAIError error', async () => {
      const { addDoc } = await import('../lib/db/supabaseData');
      (addDoc as any).mockRejectedValueOnce(new Error('Firestore Error'));
      
      mockGenerateContent.mockRejectedValue(new Error('AI Error'));
      
      await expect(generateSuggestions('test', projectContext)).rejects.toThrow('AI Error');
      // Should not crash due to logAIError failing
    });
  });

  describe('generateAssetTags', () => {
    it('returns tags', async () => {
      const mockTags = ['Tag1', 'Tag2'];
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockTags) });

      const result = await generateAssetTags('Asset1', 'Image', projectContext);
      expect(result).toEqual(mockTags);
    });
  });
});


