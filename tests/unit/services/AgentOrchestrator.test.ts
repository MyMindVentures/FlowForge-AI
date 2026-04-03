import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentOrchestrator, AgentTaskType } from '../../../src/services/ai/orchestrator';
import { AIFunctions } from '../../../src/services/ai/functions';
import { handleFirestoreError } from '../../../src/lib/firestoreErrorHandler';

// Mock Firebase
vi.mock('../../../src/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  supabase: {}
}));

const mockAddDoc = vi.fn().mockResolvedValue({ id: 'log-id' });
const mockUpdateDoc = vi.fn().mockResolvedValue({});

vi.mock('../../../src/lib/db/firestoreCompat', () => ({
  collection: vi.fn(),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  doc: vi.fn(),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args)
}));

vi.mock('../../../src/lib/firestoreErrorHandler', () => ({
  handleFirestoreError: vi.fn(),
  OperationType: { CREATE: 'create', UPDATE: 'update' }
}));

// Mock AIFunctions
vi.mock('../../../src/services/ai/functions', () => ({
  AIFunctions: {
    resolveAppContext: vi.fn(),
    generateFeatureSuggestions: vi.fn(),
    generatePRD: vi.fn(),
    generateLogoConcepts: vi.fn(),
    generateMarketingKit: vi.fn(),
    translateConcept: vi.fn(),
    translateTechnical: vi.fn(),
    generateCodingPrompt: vi.fn(),
    generateDesignPrompt: vi.fn(),
    generateTitle: vi.fn(),
    synthesizeProblem: vi.fn(),
    analyzeDifferentiation: vi.fn(),
    scoreFeature: vi.fn(),
    planSequence: vi.fn(),
    mapPages: vi.fn(),
    mapComponents: vi.fn(),
    assistArchitect: vi.fn(),
    assistBuilder: vi.fn(),
    recommendStatus: vi.fn(),
    analyzeImpact: vi.fn(),
    analyzeUIImpact: vi.fn(),
    generateUIArchitecture: vi.fn(),
    generateVisualPrompt: vi.fn(),
    generateFeatureVisual: vi.fn(),
    generatePageVisualPrompt: vi.fn(),
    generatePageDocumentation: vi.fn()
  }
}));

describe('AgentOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runTask should call AIFunctions and log success', async () => {
    const mockResult = 'Task Result';
    (AIFunctions.resolveAppContext as any).mockResolvedValue(mockResult);

    const params = { project: { name: 'P1' }, features: [] };
    const result = await AgentOrchestrator.runTask(AgentTaskType.RESOLVE_CONTEXT, params);

    expect(result).toBe(mockResult);
    expect(AIFunctions.resolveAppContext).toHaveBeenCalledWith(params.project, params.features);
    expect(mockAddDoc).toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({ status: 'success' }));
  });

  it('runTask should retry on failure and log failure after retries', async () => {
    const error = new Error('AI Error');
    (AIFunctions.resolveAppContext as any).mockRejectedValue(error);

    const params = { project: { name: 'P1' }, features: [] };
    
    await expect(AgentOrchestrator.runTask(AgentTaskType.RESOLVE_CONTEXT, params, 2))
      .rejects.toThrow('AI Error');

    expect(AIFunctions.resolveAppContext).toHaveBeenCalledTimes(2);
    expect(mockUpdateDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({ status: 'failed' }));
  });

  it('runTask should handle error without message', async () => {
    (AIFunctions.resolveAppContext as any).mockRejectedValue('String error');

    const params = { project: { name: 'P1' }, features: [] };
    
    await expect(AgentOrchestrator.runTask(AgentTaskType.RESOLVE_CONTEXT, params, 1))
      .rejects.toEqual('String error');

    expect(mockUpdateDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({ 
      status: 'failed',
      result: JSON.stringify({ error: 'Unknown error' })
    }));
  });

  it('should handle SUGGEST_FEATURES task', async () => {
    (AIFunctions.generateFeatureSuggestions as any).mockResolvedValue('features');
    await AgentOrchestrator.runTask(AgentTaskType.SUGGEST_FEATURES, { context: 'ctx', userInput: 'input', projectId: 'p1' });
    expect(AIFunctions.generateFeatureSuggestions).toHaveBeenCalledWith('ctx', 'input', 'p1');
  });

  it('should handle GENERATE_PRD task', async () => {
    (AIFunctions.generatePRD as any).mockResolvedValue('prd');
    await AgentOrchestrator.runTask(AgentTaskType.GENERATE_PRD, { context: 'ctx', features: [], projectId: 'p1' });
    expect(AIFunctions.generatePRD).toHaveBeenCalledWith('ctx', [], 'p1');
  });

  it('should handle GENERATE_LOGO task', async () => {
    (AIFunctions.generateLogoConcepts as any).mockResolvedValue('logo');
    await AgentOrchestrator.runTask(AgentTaskType.GENERATE_LOGO, { project: 'proj' });
    expect(AIFunctions.generateLogoConcepts).toHaveBeenCalledWith('proj');
  });

  it('should handle GENERATE_MARKETING_KIT task', async () => {
    (AIFunctions.generateMarketingKit as any).mockResolvedValue('marketing');
    await AgentOrchestrator.runTask(AgentTaskType.GENERATE_MARKETING_KIT, { project: 'proj', features: [] });
    expect(AIFunctions.generateMarketingKit).toHaveBeenCalledWith('proj', []);
  });

  it('should handle TRANSLATE_CONCEPT task', async () => {
    (AIFunctions.translateConcept as any).mockResolvedValue('translated');
    await AgentOrchestrator.runTask(AgentTaskType.TRANSLATE_CONCEPT, { feature: 'f1' });
    expect(AIFunctions.translateConcept).toHaveBeenCalledWith('f1');
  });

  it('should handle TRANSLATE_TECHNICAL task', async () => {
    (AIFunctions.translateTechnical as any).mockResolvedValue('translated');
    await AgentOrchestrator.runTask(AgentTaskType.TRANSLATE_TECHNICAL, { feature: 'f1' });
    expect(AIFunctions.translateTechnical).toHaveBeenCalledWith('f1');
  });

  it('should handle GENERATE_CODING_PROMPT task', async () => {
    (AIFunctions.generateCodingPrompt as any).mockResolvedValue('prompt');
    await AgentOrchestrator.runTask(AgentTaskType.GENERATE_CODING_PROMPT, { feature: 'f1', project: 'p1' });
    expect(AIFunctions.generateCodingPrompt).toHaveBeenCalledWith('f1', 'p1');
  });

  it('should handle GENERATE_DESIGN_PROMPT task', async () => {
    (AIFunctions.generateDesignPrompt as any).mockResolvedValue('prompt');
    await AgentOrchestrator.runTask(AgentTaskType.GENERATE_DESIGN_PROMPT, { feature: 'f1', project: 'p1' });
    expect(AIFunctions.generateDesignPrompt).toHaveBeenCalledWith('f1', 'p1');
  });

  it('should handle GENERATE_TITLE task', async () => {
    (AIFunctions.generateTitle as any).mockResolvedValue('title');
    await AgentOrchestrator.runTask(AgentTaskType.GENERATE_TITLE, { userInput: 'input' });
    expect(AIFunctions.generateTitle).toHaveBeenCalledWith('input');
  });

  it('should handle SYNTHESIZE_PROBLEM task', async () => {
    (AIFunctions.synthesizeProblem as any).mockResolvedValue('problem');
    await AgentOrchestrator.runTask(AgentTaskType.SYNTHESIZE_PROBLEM, { userInput: 'input' });
    expect(AIFunctions.synthesizeProblem).toHaveBeenCalledWith('input');
  });

  it('should handle ANALYZE_DIFFERENTIATION task', async () => {
    (AIFunctions.analyzeDifferentiation as any).mockResolvedValue('diff');
    await AgentOrchestrator.runTask(AgentTaskType.ANALYZE_DIFFERENTIATION, { feature: 'f1', project: 'p1' });
    expect(AIFunctions.analyzeDifferentiation).toHaveBeenCalledWith('f1', 'p1');
  });

  it('should handle SCORE_FEATURE task', async () => {
    (AIFunctions.scoreFeature as any).mockResolvedValue(80);
    await AgentOrchestrator.runTask(AgentTaskType.SCORE_FEATURE, { feature: 'f1', project: 'p1' });
    expect(AIFunctions.scoreFeature).toHaveBeenCalledWith('f1', 'p1');
  });

  it('should handle PLAN_SEQUENCE task', async () => {
    (AIFunctions.planSequence as any).mockResolvedValue('sequence');
    await AgentOrchestrator.runTask(AgentTaskType.PLAN_SEQUENCE, { features: [] });
    expect(AIFunctions.planSequence).toHaveBeenCalledWith([]);
  });

  it('should handle MAP_PAGES task', async () => {
    (AIFunctions.mapPages as any).mockResolvedValue(['page1']);
    await AgentOrchestrator.runTask(AgentTaskType.MAP_PAGES, { feature: 'f1', project: 'p1' });
    expect(AIFunctions.mapPages).toHaveBeenCalledWith('f1', 'p1');
  });

  it('should handle MAP_COMPONENTS task', async () => {
    (AIFunctions.mapComponents as any).mockResolvedValue(['comp1']);
    await AgentOrchestrator.runTask(AgentTaskType.MAP_COMPONENTS, { feature: 'f1', project: 'p1' });
    expect(AIFunctions.mapComponents).toHaveBeenCalledWith('f1', 'p1');
  });

  it('should handle ASSIST_ARCHITECT task', async () => {
    (AIFunctions.assistArchitect as any).mockResolvedValue('assist');
    await AgentOrchestrator.runTask(AgentTaskType.ASSIST_ARCHITECT, { context: 'ctx', userInput: 'input', projectId: 'p1' });
    expect(AIFunctions.assistArchitect).toHaveBeenCalledWith('ctx', 'input', 'p1');
  });

  it('should handle ASSIST_BUILDER task', async () => {
    (AIFunctions.assistBuilder as any).mockResolvedValue('assist');
    await AgentOrchestrator.runTask(AgentTaskType.ASSIST_BUILDER, { context: 'ctx', userInput: 'input', projectId: 'p1' });
    expect(AIFunctions.assistBuilder).toHaveBeenCalledWith('ctx', 'input', 'p1');
  });

  it('should handle RECOMMEND_STATUS task', async () => {
    (AIFunctions.recommendStatus as any).mockResolvedValue('status');
    await AgentOrchestrator.runTask(AgentTaskType.RECOMMEND_STATUS, { feature: 'f1' });
    expect(AIFunctions.recommendStatus).toHaveBeenCalledWith('f1');
  });

  it('should handle ANALYZE_IMPACT task', async () => {
    (AIFunctions.analyzeImpact as any).mockResolvedValue('impact');
    await AgentOrchestrator.runTask(AgentTaskType.ANALYZE_IMPACT, { feature: 'f1', project: 'p1' });
    expect(AIFunctions.analyzeImpact).toHaveBeenCalledWith('f1', 'p1');
  });

  it('should handle ANALYZE_UI_IMPACT task', async () => {
    (AIFunctions.analyzeUIImpact as any).mockResolvedValue('ui-impact');
    await AgentOrchestrator.runTask(AgentTaskType.ANALYZE_UI_IMPACT, { feature: 'f1', project: 'p1', currentArchitecture: 'arch' });
    expect(AIFunctions.analyzeUIImpact).toHaveBeenCalledWith('f1', 'p1', 'arch');
  });

  it('should handle GENERATE_UI_ARCHITECTURE task', async () => {
    (AIFunctions.generateUIArchitecture as any).mockResolvedValue('ui-arch');
    await AgentOrchestrator.runTask(AgentTaskType.GENERATE_UI_ARCHITECTURE, { project: 'p1', features: [] });
    expect(AIFunctions.generateUIArchitecture).toHaveBeenCalledWith('p1', []);
  });

  it('should handle GENERATE_VISUAL_PROMPT task', async () => {
    (AIFunctions.generateVisualPrompt as any).mockResolvedValue('prompt');
    await AgentOrchestrator.runTask(AgentTaskType.GENERATE_VISUAL_PROMPT, { feature: 'f1', project: 'p1' });
    expect(AIFunctions.generateVisualPrompt).toHaveBeenCalledWith('f1', 'p1');
  });

  it('should handle GENERATE_FEATURE_VISUAL task', async () => {
    (AIFunctions.generateFeatureVisual as any).mockResolvedValue('visual');
    await AgentOrchestrator.runTask(AgentTaskType.GENERATE_FEATURE_VISUAL, { prompt: 'prompt' });
    expect(AIFunctions.generateFeatureVisual).toHaveBeenCalledWith('prompt');
  });

  it('should handle GENERATE_PAGE_VISUAL_PROMPT task', async () => {
    (AIFunctions.generatePageVisualPrompt as any).mockResolvedValue('prompt');
    await AgentOrchestrator.runTask(AgentTaskType.GENERATE_PAGE_VISUAL_PROMPT, { page: 'p1', project: 'proj', layout: 'l1', components: [], features: [], styleSystem: 'style' });
    expect(AIFunctions.generatePageVisualPrompt).toHaveBeenCalledWith('p1', 'proj', 'l1', [], [], 'style');
  });

  it('should handle GENERATE_PAGE_DOCUMENTATION task', async () => {
    (AIFunctions.generatePageDocumentation as any).mockResolvedValue('doc');
    await AgentOrchestrator.runTask(AgentTaskType.GENERATE_PAGE_DOCUMENTATION, { page: 'p1', project: 'proj', layout: 'l1', components: [], features: [], styleSystem: 'style' });
    expect(AIFunctions.generatePageDocumentation).toHaveBeenCalledWith('p1', 'proj', 'l1', [], [], 'style');
  });

  it('should throw error for unknown task type', async () => {
    await expect(AgentOrchestrator.runTask('UNKNOWN_TASK' as any, {})).rejects.toThrow('Unknown task type: UNKNOWN_TASK');
  });

  it('createLog should handle firestore error', async () => {
    mockAddDoc.mockRejectedValueOnce(new Error('Firestore error'));
    
    await expect(AgentOrchestrator.runTask(AgentTaskType.RESOLVE_CONTEXT, {})).rejects.toThrow('Firestore error');
    expect(handleFirestoreError).toHaveBeenCalled();
  });

  it('updateLog should handle firestore error', async () => {
    (AIFunctions.resolveAppContext as any).mockResolvedValue('result');
    mockUpdateDoc.mockRejectedValueOnce(new Error('Firestore error'));
    
    await AgentOrchestrator.runTask(AgentTaskType.RESOLVE_CONTEXT, {});
    expect(handleFirestoreError).toHaveBeenCalled();
  });
});
