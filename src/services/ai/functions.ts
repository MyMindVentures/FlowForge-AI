import { GoogleGenAI, Type } from "@google/genai";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Project, Feature, Version, LLMFunction, UIPage, UIComponent, UILayout, UIStyleSystem } from "../../types";
import { FeatureSuggestionSchema, PRDSchema, LogoConceptSchema, UIImpactAnalysisSchema, UIArchitectureSchema } from "./types";

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
  private static async getFunctionConfig(name: string, projectId?: string, defaultModel: string = 'gemini-3.1-pro-preview', defaultPrompt: string = ''): Promise<{ model: string, systemInstruction: string }> {
    try {
      // 1. Try project override
      if (projectId) {
        const projectRef = doc(db, `projects/${projectId}/ai_functions`, name);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          const data = projectSnap.data() as LLMFunction;
          if (data.isEnabled) {
            return { 
              model: data.modelId || defaultModel, 
              systemInstruction: data.systemPrompt || defaultPrompt 
            };
          }
        }
      }

      // 2. Try global admin config
      const globalRef = doc(db, 'admin/ai/functions', name);
      const globalSnap = await getDoc(globalRef);
      if (globalSnap.exists()) {
        const data = globalSnap.data() as LLMFunction;
        if (data.isEnabled) {
          return { 
            model: data.modelId || defaultModel, 
            systemInstruction: data.systemPrompt || defaultPrompt 
          };
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch config for function ${name}:`, error);
    }

    // 3. Fallback to defaults
    return {
      model: defaultModel,
      systemInstruction: defaultPrompt
    };
  }

  static async resolveAppContext(project: Project, features: Feature[]): Promise<string> {
    const config = await this.getFunctionConfig('resolveAppContext', project.id, LLMModelRouter.getModel('simple'), "You are a context resolver. Summarize the project in 3-5 sentences to be used as context for other AI tasks.");
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: config.model,
      contents: `
        Summarize the following project context for an AI assistant:
        Project Name: ${project.name}
        Description: ${project.description}
        App Vision: ${project.appVision || 'Not defined'}
        Current Features: ${features.map(f => f.title).join(', ')}
      `,
      config: {
        systemInstruction: config.systemInstruction
      }
    });

    const response = await model;
    return response.text || '';
  }

  static async generateFeatureSuggestions(context: string, userInput: string, projectId?: string): Promise<any> {
    const config = await this.getFunctionConfig('generateFeatureSuggestions', projectId, LLMModelRouter.getModel('complex'), "You are a product strategist. Generate 5 high-value feature suggestions in JSON format.");
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: config.model,
      contents: `
        Context: ${context}
        User Input: ${userInput}
        
        Generate 5 feature suggestions that align with the project vision and address the user's input.
      `,
      config: {
        systemInstruction: config.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: FeatureSuggestionSchema
      }
    });

    const response = await model;
    return safeJsonParse(response.text, []);
  }

  static async generatePRD(context: string, features: Feature[], projectId?: string): Promise<any> {
    const config = await this.getFunctionConfig('generatePRD', projectId, LLMModelRouter.getModel('complex'), "You are a lead product manager. Generate a detailed PRD in JSON format including prd (markdown), conceptSummary, and tagline.");
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: config.model,
      contents: `
        Context: ${context}
        Features to include: ${features.map(f => `${f.title}: ${f.nonTechnicalDescription}`).join('\n')}
        
        Generate a comprehensive Product Requirements Document (PRD).
      `,
      config: {
        systemInstruction: config.systemInstruction,
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

  static async translateConcept(feature: Feature): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('simple'),
      contents: `Feature: ${feature.title}\nDescription: ${feature.nonTechnicalDescription}`,
      config: {
        systemInstruction: "You are a ConceptTranslator. Turn the feature data into understandable no-coder language for a founder or strategist."
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async translateTechnical(feature: Feature): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('complex'),
      contents: `Feature: ${feature.title}\nDescription: ${feature.technicalDescription}`,
      config: {
        systemInstruction: "You are a TechnicalTranslator. Turn the feature data into a clear build brief for a developer."
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async generateCodingPrompt(feature: Feature, project: Project): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('complex'),
      contents: `Project: ${project.name}\nFeature: ${feature.title}\nTechnical: ${feature.technicalDescription}`,
      config: {
        systemInstruction: "You are a CodingPromptGenerator. Create a detailed coding prompt for a build agent or developer to implement this feature."
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async generateDesignPrompt(feature: Feature, project: Project): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('creative'),
      contents: `Project: ${project.name}\nFeature: ${feature.title}\nConcept: ${feature.nonTechnicalDescription}`,
      config: {
        systemInstruction: "You are a UIDesignPromptGenerator. Create a detailed design prompt for a UI or design agent to design this feature."
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async generateTitle(userInput: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('simple'),
      contents: userInput,
      config: {
        systemInstruction: "You are a FeatureTitleGenerator. Create a concise and impactful title for a feature based on the user's description."
      }
    });
    const response = await model;
    return response.text?.replace(/"/g, '') || '';
  }

  static async synthesizeProblem(userInput: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('simple'),
      contents: userInput,
      config: {
        systemInstruction: "You are a ProblemValueSynthesizer. Create a short explanation of what this feature solves and why it matters."
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async analyzeDifferentiation(feature: Feature, project: Project): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('complex'),
      contents: `Project: ${project.name}\nFeature: ${feature.title}`,
      config: {
        systemInstruction: "You are a DifferentiationAnalyzer. Check how this feature is different from generic alternatives."
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async scoreFeature(feature: Feature, project: Project): Promise<number> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('simple'),
      contents: `Project: ${project.name}\nFeature: ${feature.title}\nPriority: ${feature.priority}`,
      config: {
        systemInstruction: "You are a FeatureScorer. Give this feature a score from 1-100 based on its value and alignment. Return ONLY the number."
      }
    });
    const response = await model;
    return parseInt(response.text || '0', 10);
  }

  static async planSequence(features: Feature[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('complex'),
      contents: `Features: ${features.map(f => f.title).join(', ')}`,
      config: {
        systemInstruction: "You are an ImplementationSequencePlanner. Determine a logical build sequence for these features."
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async mapPages(feature: Feature, project: Project): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('simple'),
      contents: `Project: ${project.name}\nFeature: ${feature.title}`,
      config: {
        systemInstruction: "You are a RelatedPageMapper. List the pages in the app that this feature affects. Return as a comma-separated list."
      }
    });
    const response = await model;
    return (response.text || '').split(',').map(s => s.trim());
  }

  static async mapComponents(feature: Feature, project: Project): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('simple'),
      contents: `Project: ${project.name}\nFeature: ${feature.title}`,
      config: {
        systemInstruction: "You are a RelatedComponentMapper. List the UI components that this feature affects. Return as a comma-separated list."
      }
    });
    const response = await model;
    return (response.text || '').split(',').map(s => s.trim());
  }

  static async assistArchitect(context: string, userInput: string, projectId?: string): Promise<string> {
    const config = await this.getFunctionConfig('assistArchitect', projectId, LLMModelRouter.getModel('complex'), "You are an ArchitectCommentAssistant. Help the product architect with comments, decisions, or definitions.");
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: config.model,
      contents: `Context: ${context}\nUser: ${userInput}`,
      config: {
        systemInstruction: config.systemInstruction
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async assistBuilder(context: string, userInput: string, projectId?: string): Promise<string> {
    const config = await this.getFunctionConfig('assistBuilder', projectId, LLMModelRouter.getModel('complex'), "You are a BuilderCommentAssistant. Help the developer with technical comments or clarifications.");
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: config.model,
      contents: `Context: ${context}\nUser: ${userInput}`,
      config: {
        systemInstruction: config.systemInstruction
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async recommendStatus(feature: Feature): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('simple'),
      contents: `Feature: ${feature.title}\nCurrent Status: ${feature.status}`,
      config: {
        systemInstruction: "You are a StatusRecommendationEngine. Suggest the right status for this feature (Pending, In Progress, Completed)."
      }
    });
    const response = await model;
    return response.text || feature.status;
  }

  static async analyzeImpact(feature: Feature, project: Project): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: LLMModelRouter.getModel('complex'),
      contents: `Project: ${project.name}\nFeature: ${feature.title}`,
      config: {
        systemInstruction: "You are a Change Impact Engine. Analyze the impact of this feature on the overall project."
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async generateVisualPrompt(feature: Feature, project: Project): Promise<string> {
    const config = await this.getFunctionConfig('generateVisualPrompt', project.id, LLMModelRouter.getModel('creative'), "You are a FeatureVisualPromptGenerator. Create a high-quality image generation prompt based on feature data.");
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: config.model,
      contents: `
        Project: ${project.name}
        Feature Title: ${feature.title}
        Problem: ${feature.problem}
        Description: ${feature.nonTechnicalDescription}
        
        Create a detailed image generation prompt that visually represents this feature. 
        Focus on UI/UX elements, app interface, or a conceptual illustration of the value.
        The prompt should be descriptive and optimized for an AI image generator.
        Keep it professional, modern, and aligned with a premium software product.
      `,
      config: {
        systemInstruction: config.systemInstruction
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async generateFeatureVisual(prompt: string, projectId?: string): Promise<string> {
    const config = await this.getFunctionConfig('generateFeatureVisual', projectId, 'gemini-2.5-flash-image');
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: config.model,
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });
    
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error('No image generated');
  }

  static async analyzeUIImpact(feature: Feature, project: Project, currentArchitecture: { pages: UIPage[], components: UIComponent[], layouts: UILayout[] }): Promise<any> {
    const config = await this.getFunctionConfig('analyzeUIImpact', project.id, LLMModelRouter.getModel('complex'), "You are a UI Change Impact Analyzer. Detect which pages, layouts, and components are affected by a new feature.");
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: config.model,
      contents: `
        Project: ${project.name}
        Feature: ${feature.title}
        Description: ${feature.nonTechnicalDescription}
        
        Current Architecture:
        Pages: ${currentArchitecture.pages.map(p => p.name).join(', ')}
        Components: ${currentArchitecture.components.map(c => c.name).join(', ')}
        Layouts: ${currentArchitecture.layouts.map(l => l.name).join(', ')}
        
        Analyze the impact of this feature. Determine if existing pages/components can be reused or if new ones are needed.
        Define the mobile UI pattern for this feature.
      `,
      config: {
        systemInstruction: config.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: UIImpactAnalysisSchema
      }
    });

    const response = await model;
    return safeJsonParse(response.text, {});
  }

  static async generateUIArchitecture(project: Project, features: Feature[]): Promise<any> {
    const config = await this.getFunctionConfig('generateUIArchitecture', project.id, LLMModelRouter.getModel('complex'), "You are a UI Architect. Define the initial UI architecture (pages, components, style system) for a project based on its features.");
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: config.model,
      contents: `
        Project: ${project.name}
        Description: ${project.description}
        Features: ${features.map(f => f.title).join(', ')}
        
        Define a structured UI architecture. 
        - Pages with paths and purposes.
        - Reusable components with types and guidelines.
        - A consistent style system (colors, typography).
      `,
      config: {
        systemInstruction: config.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: UIArchitectureSchema
      }
    });

    const response = await model;
    return safeJsonParse(response.text, {});
  }

  static async generatePageVisualPrompt(page: UIPage, project: Project, layout?: UILayout, components: UIComponent[] = [], features: Feature[] = [], styleSystem?: UIStyleSystem): Promise<string> {
    const config = await this.getFunctionConfig('generatePageVisualPrompt', project.id, LLMModelRouter.getModel('creative'), "You are a PageVisualPromptGenerator. Create a high-quality image generation prompt for a specific app page.");
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: config.model,
      contents: `
        Project: ${project.name}
        Page Name: ${page.name}
        Path: ${page.path}
        Purpose: ${page.purpose}
        Layout: ${layout?.name || 'Standard'}
        Components: ${components.map(c => c.name).join(', ')}
        Linked Features: ${features.map(f => f.title).join(', ')}
        Style System: ${styleSystem ? JSON.stringify(styleSystem.colors) : 'Default Dark'}
        
        Create a detailed image generation prompt that visually represents this specific page. 
        Focus on the layout structure, the key components, and the overall UI/UX feel.
        The prompt should be descriptive and optimized for an AI image generator.
        Keep it professional, modern, and aligned with the project's style.
      `,
      config: {
        systemInstruction: config.systemInstruction
      }
    });
    const response = await model;
    return response.text || '';
  }

  static async generatePageDocumentation(page: UIPage, project: Project, layout?: UILayout, components: UIComponent[] = [], features: Feature[] = [], styleSystem?: UIStyleSystem): Promise<string> {
    const config = await this.getFunctionConfig('generatePageDocumentation', project.id, LLMModelRouter.getModel('complex'), "You are a UI/UX Documentation Specialist. Generate a professional developer-ready page specification in Markdown.");
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
      model: config.model,
      contents: `
        Project: ${project.name}
        Page Name: ${page.name}
        Path: ${page.path}
        Purpose: ${page.purpose}
        Layout: ${layout?.name || 'Standard'} (${layout?.description || ''})
        Components: ${components.map(c => `${c.name} (${c.type}): ${c.purpose}`).join('\n')}
        Linked Features: ${features.map(f => `${f.title}: ${f.nonTechnicalDescription}`).join('\n')}
        Style System: ${styleSystem ? JSON.stringify(styleSystem) : 'Default Dark'}
        
        Generate a detailed UI/UX documentation for this page. 
        Include:
        - Page Goal & Overview
        - Information Hierarchy
        - Content Sections & Layout Structure
        - Component Usage & Props
        - Interaction Behavior (what happens when user clicks/taps)
        - Key States (Empty, Loading, Success, Error, Validation, Restricted)
        - Continuity & Navigation (how it connects to other pages)
        
        Format as clear, structured Markdown. Use headings, lists, and bold text for readability.
        The tone should be professional, technical, and precise.
      `,
      config: {
        systemInstruction: config.systemInstruction
      }
    });
    const response = await model;
    return response.text || '';
  }
}
