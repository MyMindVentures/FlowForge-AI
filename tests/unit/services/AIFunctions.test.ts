import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIFunctions, LLMModelRouter } from '../../../src/services/ai/functions';
import { GoogleGenAI } from '@google/genai';

// Mock Firebase
vi.mock('../../../src/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  supabase: {}
}));

vi.mock('../../../src/lib/db/firestoreCompat', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => false,
    data: () => ({})
  }),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
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

describe('AIFunctions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProject = {
    id: 'p1',
    name: 'Test Project',
    description: 'Test Description',
    ownerId: 'u1',
    createdAt: '',
    updatedAt: '',
    status: 'Active',
    isFavorite: false,
    members: [],
    repositories: []
  } as any;

  const mockFeatures = [
    { id: 'f1', title: 'Feature 1', nonTechnicalDescription: 'Desc 1' }
  ] as any;

  it('resolveAppContext should return a summary', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'Project summary'
    });

    const result = await AIFunctions.resolveAppContext(mockProject, mockFeatures);
    expect(result).toBe('Project summary');
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('generateFeatureSuggestions should return suggestions', async () => {
    const suggestions = [
      { title: 'S1', description: 'D1', priority: 'High', complexity: 'Small', userValue: 'V1' }
    ];
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(suggestions)
    });

    const result = await AIFunctions.generateFeatureSuggestions('context', 'input');
    expect(result).toEqual(suggestions);
  });

  it('generatePRD should return PRD data', async () => {
    const prd = {
      overview: 'Overview',
      userStories: ['Story 1'],
      technicalRequirements: ['Req 1'],
      successMetrics: ['Metric 1']
    };
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(prd)
    });

    const result = await AIFunctions.generatePRD('context', mockFeatures);
    expect(result).toEqual(prd);
  });

  it('generateMarketingKit should return marketing kit data', async () => {
    const kit = {
      tagline: 'Tagline',
      valueProps: ['Prop 1']
    };
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(kit)
    });

    const result = await AIFunctions.generateMarketingKit(mockProject, mockFeatures);
    expect(result).toEqual(kit);
  });

  it('generateLogoConcepts should return concepts', async () => {
    const concepts = [
      { concept: 'C1', visualDescription: 'V1', rationale: 'R1', prompt: 'P1' }
    ];
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(concepts)
    });

    const result = await AIFunctions.generateLogoConcepts(mockProject);
    expect(result).toEqual(concepts);
  });

  it('safeJsonParse should handle invalid JSON', async () => {
    mockGenerateContent.mockResolvedValue({
      text: 'Invalid JSON'
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await AIFunctions.generateLogoConcepts(mockProject);
    expect(result).toEqual([]); // Default value
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('safeJsonParse should handle empty text', async () => {
    mockGenerateContent.mockResolvedValue({
      text: ''
    });

    const result = await AIFunctions.generateLogoConcepts(mockProject);
    expect(result).toEqual([]); // Default value
  });

  it('LLMModelRouter should return default model for unknown task type', () => {
    expect(LLMModelRouter.getModel('unknown' as any)).toBe('gemini-3-flash-preview');
  });

  describe('getApiKey', () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should get key from process.env.GEMINI_API_KEY', async () => {
      vi.stubEnv('GEMINI_API_KEY', 'test-key-1');
      await AIFunctions.resolveAppContext(mockProject, mockFeatures);
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-key-1' });
    });

    it('should get key from process.env.API_KEY', async () => {
      vi.stubEnv('API_KEY', 'test-key-2');
      await AIFunctions.resolveAppContext(mockProject, mockFeatures);
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-key-2' });
    });

    it('should return empty string if no key found', async () => {
      await AIFunctions.resolveAppContext(mockProject, mockFeatures);
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: '' });
    });

    it('should get key from import.meta.env.VITE_GEMINI_API_KEY', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key-3');

      await AIFunctions.resolveAppContext(mockProject, mockFeatures);
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-key-3' });
    });

    it('should catch error and return empty string', async () => {
      // Mock process.env to throw an error
      const originalEnv = Object.getOwnPropertyDescriptor(process, 'env');
      Object.defineProperty(process, 'env', {
        get: () => { throw new Error('Access denied'); },
        configurable: true
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await AIFunctions.resolveAppContext(mockProject, mockFeatures);
      
      expect(consoleSpy).toHaveBeenCalledWith('Error accessing API key', expect.any(Error));
      expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: '' });
      
      consoleSpy.mockRestore();
      // Restore process.env
      if (originalEnv) {
        Object.defineProperty(process, 'env', originalEnv);
      }
    });
  });
});
