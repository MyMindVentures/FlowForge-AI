import { GoogleGenAI, Type } from "@google/genai";
import { Project, Feature, Version } from "../../types";
import { FeatureSuggestionSchema, PRDSchema, LogoConceptSchema } from "./types";

const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
    // Fallback for Vite client-side if injected via import.meta.env
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {
    console.warn('Error accessing API key', e);
  }
  return '';
};

const safeJsonParse = (text: string | undefined, defaultVal: any) => {
  if (!text) return defaultVal;
  try {
    // Remove markdown code blocks if present
    const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('Failed to parse JSON response:', text);
    return defaultVal;
  }
};

export class LLMModelRouter {
  static getModel(taskType: 'simple' | 'complex' | 'creative'): string {
    switch (taskType) {
      case 'simple': return 'gemini-3-flash-preview';
      case 'complex': return 'gemini-3.1-pro-preview';
      case 'creative': return 'gemini-3-flash-preview';
      default: return 'gemini-3-flash-preview';
    }
  }
}

export class AIFunctions {
  static async resolveAppContext(project: Project, features: Feature[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('simple'),
      contents: `
        Summarize the following project context for an AI assistant:
        Project Name: ${project.name}
        Description: ${project.description}
        App Vision: ${project.appVision || 'Not defined'}
        Current Features: ${features.map(f => f.title).join(', ')}
      `,
      config: {
        systemInstruction: "You are a context resolver. Summarize the project in 3-5 sentences to be used as context for other AI tasks."
      }
    });

    const response = await model;
    return response.text || '';
  }

  static async generateFeatureSuggestions(context: string, userInput: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('complex'),
      contents: `
        Context: ${context}
        User Input: ${userInput}
        
        Generate 5 feature suggestions that align with the project vision and address the user's input.
      `,
      config: {
        systemInstruction: "You are a product strategist. Generate 5 high-value feature suggestions in JSON format.",
        responseMimeType: "application/json",
        responseSchema: FeatureSuggestionSchema
      }
    });

    const response = await model;
    return safeJsonParse(response.text, []);
  }

  static async generatePRD(context: string, features: Feature[]): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('complex'),
      contents: `
        Context: ${context}
        Features to include: ${features.map(f => `${f.title}: ${f.nonTechnicalDescription}`).join('\n')}
        
        Generate a comprehensive Product Requirements Document (PRD).
      `,
      config: {
        systemInstruction: "You are a lead product manager. Generate a detailed PRD in JSON format including prd (markdown), conceptSummary, and tagline.",
        responseMimeType: "application/json",
        responseSchema: PRDSchema
      }
    });

    const response = await model;
    return safeJsonParse(response.text, {});
  }

  static async generateMarketingKit(project: Project, features: Feature[]): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('creative'),
      contents: `
        Project: ${project.name}
        Description: ${project.description}
        Features: ${features.map(f => f.title).join(', ')}
        
        Generate a marketing kit including taglines, value propositions, and pitch narrative.
      `,
      config: {
        systemInstruction: "You are a marketing strategist. Generate a marketing kit in JSON format.",
        responseMimeType: "application/json"
      }
    });

    const response = await model;
    return safeJsonParse(response.text, {});
  }

  static async generateLogoConcepts(project: Project): Promise<any> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('creative'),
      contents: `
        Project Name: ${project.name}
        Description: ${project.description}
        Vision: ${project.appVision || ''}
        
        Generate 3 unique logo concepts with visual descriptions and rationale.
      `,
      config: {
        systemInstruction: "You are a brand designer. Generate 3 logo concepts in JSON format.",
        responseMimeType: "application/json",
        responseSchema: LogoConceptSchema
      }
    });

    const response = await model;
    return safeJsonParse(response.text, []);
  }
}
