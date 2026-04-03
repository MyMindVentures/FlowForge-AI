import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIFunctions, LLMModelRouter } from './functions';

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  supabase: {}
}));

vi.mock('../../lib/db/firestoreCompat', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => false,
    data: () => null
  })
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

describe('AIFunctions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const project = { id: 'p1', name: 'Test Project', description: 'Test Desc' } as any;
  const features = [{ title: 'F1', nonTechnicalDescription: 'D1', status: 'Completed' }] as any;

  describe('resolveAppContext', () => {
    it('returns a summary of the project context', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Project Summary' });
      const result = await AIFunctions.resolveAppContext(project, features);
      expect(result).toBe('Project Summary');
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe('generateFeatureSuggestions', () => {
    it('returns 5 feature suggestions', async () => {
      const mockSuggestions = [
        { title: 'S1', description: 'D1', priority: 'High', complexity: 'Medium', userValue: 'V1' },
        { title: 'S2', description: 'D2', priority: 'Low', complexity: 'Small', userValue: 'V2' },
        { title: 'S3', description: 'D3', priority: 'Medium', complexity: 'Large', userValue: 'V3' },
        { title: 'S4', description: 'D4', priority: 'Critical', complexity: 'Medium', userValue: 'V4' },
        { title: 'S5', description: 'D5', priority: 'High', complexity: 'Small', userValue: 'V5' }
      ];
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockSuggestions) });
      
      const result = await AIFunctions.generateFeatureSuggestions('context', 'input', 'p1');
      expect(result).toEqual(mockSuggestions);
      expect(result).toHaveLength(5);
    });
  });

  describe('generatePRD', () => {
    it('returns a structured PRD', async () => {
      const mockPRD = { 
        overview: 'Overview', 
        userStories: ['Story 1'], 
        technicalRequirements: ['Req 1'], 
        successMetrics: ['Metric 1'] 
      };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockPRD) });
      
      const result = await AIFunctions.generatePRD('context', features, 'p1');
      expect(result).toEqual(mockPRD);
    });
  });

  describe('scoreFeature', () => {
    it('returns a numeric score', async () => {
      mockGenerateContent.mockResolvedValue({ text: '85' });
      const result = await AIFunctions.scoreFeature(features[0], project);
      expect(result).toBe(85);
    });

    it('handles non-numeric response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'invalid' });
      const result = await AIFunctions.scoreFeature(features[0], project);
      expect(result).toBeNaN();
    });
  });

  describe('runFunction', () => {
    it('executes a generic function by name', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Generic Result' });
      const result = await AIFunctions.runFunction('testFunc', { arg: 1 }, 'p1');
      expect(result).toBe('Generic Result');
    });

    it('parses JSON if the result looks like JSON', async () => {
      const mockJson = { key: 'value' };
      mockGenerateContent.mockResolvedValue({ text: JSON.stringify(mockJson) });
      const result = await AIFunctions.runFunction('testFunc', {}, 'p1');
      expect(result).toEqual(mockJson);
    });
  });
});

describe('LLMModelRouter', () => {
  it('returns correct models for task types', () => {
    expect(LLMModelRouter.getModel('simple')).toBe('gemini-3-flash-preview');
    expect(LLMModelRouter.getModel('complex')).toBe('gemini-3.1-pro-preview');
    expect(LLMModelRouter.getModel('creative')).toBe('gemini-3-flash-preview');
  });
});
