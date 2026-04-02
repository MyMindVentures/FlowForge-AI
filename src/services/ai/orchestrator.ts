import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
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
}

export class AgentOrchestrator {
  static async runTask(taskType: AgentTaskType, params: any, retries: number = 3): Promise<any> {
    const startTime = Date.now();
    const logId = await this.createLog(taskType, params);
    let lastError: any;

    for (let i = 0; i < retries; i++) {
      try {
        let result;
        switch (taskType) {
          case AgentTaskType.RESOLVE_CONTEXT:
            result = await AIFunctions.resolveAppContext(params.project, params.features);
            break;
          case AgentTaskType.SUGGEST_FEATURES:
            result = await AIFunctions.generateFeatureSuggestions(params.context, params.userInput);
            break;
          case AgentTaskType.GENERATE_PRD:
            result = await AIFunctions.generatePRD(params.context, params.features);
            break;
          case AgentTaskType.GENERATE_LOGO:
            result = await AIFunctions.generateLogoConcepts(params.project);
            break;
          case AgentTaskType.GENERATE_MARKETING_KIT:
            result = await AIFunctions.generateMarketingKit(params.project, params.features);
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
      const logRef = await addDoc(collection(db, 'ai_logs'), {
        taskType,
        params: JSON.stringify(params),
        status: 'pending',
        userId: auth.currentUser?.uid,
        timestamp: new Date().toISOString(),
      });
      return logRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ai_logs');
      throw error;
    }
  }

  private static async updateLog(logId: string, status: 'success' | 'failed', result: any, latency: number) {
    try {
      await updateDoc(doc(db, 'ai_logs', logId), {
        status,
        result: JSON.stringify(result),
        latency,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `ai_logs/${logId}`);
    }
  }
}
