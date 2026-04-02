import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentOrchestrator, AgentTaskType } from '../../../src/services/ai/orchestrator';
import { AIFunctions } from '../../../src/services/ai/functions';
import { handleFirestoreError } from '../../../src/lib/firestoreErrorHandler';

// Mock Firebase
vi.mock('../../../src/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

const mockAddDoc = vi.fn().mockResolvedValue({ id: 'log-id' });
const mockUpdateDoc = vi.fn().mockResolvedValue({});

vi.mock('firebase/firestore', () => ({
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
    generateMarketingKit: vi.fn()
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
