import { collection, addDoc, doc, updateDoc } from '../../lib/db/firestoreCompat';
import { db, auth } from '../../firebase';
import { AIFunctions } from './functions';
import { Project, Feature } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/firestoreErrorHandler';

export enum AgentTaskType {
  RESOLVE_CONTEXT = 'RESOLVE_CONTEXT',
  SUGGEST_FEATURES = 'SUGGEST_FEATURES',
  GENERATE_PRD = 'GENERATE_PRD',
  GENERATE_LOGO = 'GENERATE_LOGO',
  GENERATE_MARKETING_KIT = 'GENERATE_MARKETING_KIT',
  TRANSLATE_CONCEPT = 'TRANSLATE_CONCEPT',
  TRANSLATE_TECHNICAL = 'TRANSLATE_TECHNICAL',
  GENERATE_CODING_PROMPT = 'GENERATE_CODING_PROMPT',
  GENERATE_DESIGN_PROMPT = 'GENERATE_DESIGN_PROMPT',
  GENERATE_TITLE = 'GENERATE_TITLE',
  SYNTHESIZE_PROBLEM = 'SYNTHESIZE_PROBLEM',
  ANALYZE_DIFFERENTIATION = 'ANALYZE_DIFFERENTIATION',
  SCORE_FEATURE = 'SCORE_FEATURE',
  PLAN_SEQUENCE = 'PLAN_SEQUENCE',
  MAP_PAGES = 'MAP_PAGES',
  MAP_COMPONENTS = 'MAP_COMPONENTS',
  ASSIST_ARCHITECT = 'ASSIST_ARCHITECT',
  ASSIST_BUILDER = 'ASSIST_BUILDER',
  RECOMMEND_STATUS = 'RECOMMEND_STATUS',
  ANALYZE_IMPACT = 'ANALYZE_IMPACT',
  ANALYZE_UI_IMPACT = 'ANALYZE_UI_IMPACT',
  GENERATE_UI_ARCHITECTURE = 'GENERATE_UI_ARCHITECTURE',
  GENERATE_VISUAL_PROMPT = 'GENERATE_VISUAL_PROMPT',
  GENERATE_FEATURE_VISUAL = 'GENERATE_FEATURE_VISUAL',
  GENERATE_PAGE_VISUAL_PROMPT = 'GENERATE_PAGE_VISUAL_PROMPT',
  GENERATE_PAGE_DOCUMENTATION = 'GENERATE_PAGE_DOCUMENTATION',
}

export class AgentOrchestrator {
  async executeTask<T>(taskType: AgentTaskType, params: any, retries: number = 3): Promise<T> {
    return await AgentOrchestrator.runTask(taskType, params, retries);
  }

  static async runTask(taskType: AgentTaskType, params: any, retries: number = 3): Promise<any> {
    const startTime = Date.now();
    const logId = await this.createLog(taskType, params);
    let lastError: any;

    for (let i = 0; i < retries; i++) {
      try {
        let result;
        const projectId = params.project?.id || params.feature?.projectId || params.projectId;

        switch (taskType) {
          case AgentTaskType.RESOLVE_CONTEXT:
            result = await AIFunctions.resolveAppContext(params.project, params.features);
            break;
          case AgentTaskType.SUGGEST_FEATURES:
            result = await AIFunctions.generateFeatureSuggestions(params.context, params.userInput, projectId);
            break;
          case AgentTaskType.GENERATE_PRD:
            result = await AIFunctions.generatePRD(params.context, params.features, projectId);
            break;
          case AgentTaskType.GENERATE_LOGO:
            result = await AIFunctions.generateLogoConcepts(params.project);
            break;
          case AgentTaskType.GENERATE_MARKETING_KIT:
            result = await AIFunctions.generateMarketingKit(params.project, params.features);
            break;
          case AgentTaskType.TRANSLATE_CONCEPT:
            result = await AIFunctions.translateConcept(params.feature);
            break;
          case AgentTaskType.TRANSLATE_TECHNICAL:
            result = await AIFunctions.translateTechnical(params.feature);
            break;
          case AgentTaskType.GENERATE_CODING_PROMPT:
            result = await AIFunctions.generateCodingPrompt(params.feature, params.project);
            break;
          case AgentTaskType.GENERATE_DESIGN_PROMPT:
            result = await AIFunctions.generateDesignPrompt(params.feature, params.project);
            break;
          case AgentTaskType.GENERATE_TITLE:
            result = await AIFunctions.generateTitle(params.userInput);
            break;
          case AgentTaskType.SYNTHESIZE_PROBLEM:
            result = await AIFunctions.synthesizeProblem(params.userInput);
            break;
          case AgentTaskType.ANALYZE_DIFFERENTIATION:
            result = await AIFunctions.analyzeDifferentiation(params.feature, params.project);
            break;
          case AgentTaskType.SCORE_FEATURE:
            result = await AIFunctions.scoreFeature(params.feature, params.project);
            break;
          case AgentTaskType.PLAN_SEQUENCE:
            result = await AIFunctions.planSequence(params.features);
            break;
          case AgentTaskType.MAP_PAGES:
            result = await AIFunctions.mapPages(params.feature, params.project);
            break;
          case AgentTaskType.MAP_COMPONENTS:
            result = await AIFunctions.mapComponents(params.feature, params.project);
            break;
          case AgentTaskType.ASSIST_ARCHITECT:
            result = await AIFunctions.assistArchitect(params.context, params.userInput, projectId);
            break;
          case AgentTaskType.ASSIST_BUILDER:
            result = await AIFunctions.assistBuilder(params.context, params.userInput, projectId);
            break;
          case AgentTaskType.RECOMMEND_STATUS:
            result = await AIFunctions.recommendStatus(params.feature);
            break;
          case AgentTaskType.ANALYZE_IMPACT:
            result = await AIFunctions.analyzeImpact(params.feature, params.project);
            break;
          case AgentTaskType.ANALYZE_UI_IMPACT:
            result = await AIFunctions.analyzeUIImpact(params.feature, params.project, params.currentArchitecture);
            break;
          case AgentTaskType.GENERATE_UI_ARCHITECTURE:
            result = await AIFunctions.generateUIArchitecture(params.project, params.features);
            break;
          case AgentTaskType.GENERATE_VISUAL_PROMPT:
            result = await AIFunctions.generateVisualPrompt(params.feature, params.project);
            break;
          case AgentTaskType.GENERATE_FEATURE_VISUAL:
            result = await AIFunctions.generateFeatureVisual(params.prompt);
            break;
          case AgentTaskType.GENERATE_PAGE_VISUAL_PROMPT:
            result = await AIFunctions.generatePageVisualPrompt(params.page, params.project, params.layout, params.components, params.features, params.styleSystem);
            break;
          case AgentTaskType.GENERATE_PAGE_DOCUMENTATION:
            result = await AIFunctions.generatePageDocumentation(params.page, params.project, params.layout, params.components, params.features, params.styleSystem);
            break;
          default:
            throw new Error(`Unknown task type: ${taskType}`);
        }

        const latency = Date.now() - startTime;
        await this.updateLog(logId, 'success', result, latency);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`AI Task ${taskType} failed (attempt ${i + 1}/${retries}):`, error);
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
        }
      }
    }

    const latency = Date.now() - startTime;
    await this.updateLog(logId, 'failed', { error: lastError?.message || 'Unknown error' }, latency);
    throw lastError;
  }

  private static async createLog(taskType: AgentTaskType, params: any): Promise<string> {
    try {
      const projectId = params.project?.id || params.feature?.projectId || params.projectId;
      
      let stringifiedParams = JSON.stringify(params);
      
      // Firestore document limit is 1MB. If params are too large, we truncate them.
      if (stringifiedParams.length > 800000) {
        stringifiedParams = JSON.stringify({ 
          message: 'Params too large for logging', 
          size: stringifiedParams.length,
          truncated: true
        });
      }

      const logData = {
        taskType,
        params: stringifiedParams,
        status: 'pending',
        userId: auth.currentUser?.uid,
        timestamp: new Date().toISOString(),
        projectId: projectId || null
      };

      // Log to project-specific collection if projectId exists, otherwise root (fallback)
      const collectionPath = projectId ? `projects/${projectId}/ai_logs` : 'ai_logs';
      const logRef = await addDoc(collection(db, collectionPath), logData);
      
      return projectId ? `${projectId}:${logRef.id}` : `global:${logRef.id}`;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ai_logs');
      throw error;
    }
  }

  private static async updateLog(logId: string, status: 'success' | 'failed', result: any, latency: number) {
    try {
      const [pathPart, idPart] = logId.includes(':') ? logId.split(':') : ['global', logId];
      const collectionPath = pathPart === 'global' ? 'ai_logs' : `projects/${pathPart}/ai_logs`;
      
      let stringifiedResult = JSON.stringify(result);
      
      // Firestore document limit is 1MB. If result is too large, we truncate it.
      // We use 800KB as a safe threshold.
      if (stringifiedResult.length > 800000) {
        stringifiedResult = JSON.stringify({ 
          message: 'Result too large for logging', 
          size: stringifiedResult.length,
          truncated: true
        });
      }

      await updateDoc(doc(db, collectionPath, idPart), {
        status,
        result: stringifiedResult,
        latency,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      const [pathPart, idPart] = logId.includes(':') ? logId.split(':') : ['global', logId];
      const fullPath = pathPart === 'global' ? `ai_logs/${idPart}` : `projects/${pathPart}/ai_logs/${idPart}`;
      handleFirestoreError(error, OperationType.UPDATE, fullPath);
    }
  }
}
