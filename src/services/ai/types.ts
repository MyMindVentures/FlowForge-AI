import { Type } from "@google/genai";

export interface AIResponse<T> {
  data: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  latency: number;
}

// --- Feature Chat ---

export const FeatureSuggestionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
      complexity: { type: Type.STRING, enum: ['Small', 'Medium', 'Large'] },
      userValue: { type: Type.STRING },
    },
    required: ['title', 'description', 'priority', 'complexity', 'userValue'],
  },
};

export interface FeatureSuggestion {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  complexity: 'Small' | 'Medium' | 'Large';
  userValue: string;
}

// --- Documentation ---

export const PRDSchema = {
  type: Type.OBJECT,
  properties: {
    overview: { type: Type.STRING },
    userStories: { 
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    technicalRequirements: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    successMetrics: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ['overview', 'userStories', 'technicalRequirements', 'successMetrics']
};

export interface PRD {
  overview: string;
  userStories: string[];
  technicalRequirements: string[];
  successMetrics: string[];
}

// --- Agents ---

export const LogoConceptSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      concept: { type: Type.STRING },
      visualDescription: { type: Type.STRING },
      rationale: { type: Type.STRING },
      prompt: { type: Type.STRING }
    },
    required: ['concept', 'visualDescription', 'rationale', 'prompt']
  }
};

export interface LogoConcept {
  concept: string;
  visualDescription: string;
  rationale: string;
  prompt: string;
}

// --- UI Architecture ---

export const UIImpactAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    affectedPages: { type: Type.ARRAY, items: { type: Type.STRING } },
    affectedLayouts: { type: Type.ARRAY, items: { type: Type.STRING } },
    affectedComponents: { type: Type.ARRAY, items: { type: Type.STRING } },
    mobilePattern: { type: Type.STRING },
    recommendation: { type: Type.STRING },
    newPagesNeeded: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          purpose: { type: Type.STRING },
          layoutType: { type: Type.STRING }
        },
        required: ['name', 'purpose', 'layoutType']
      }
    },
    newComponentsNeeded: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          purpose: { type: Type.STRING }
        },
        required: ['name', 'type', 'purpose']
      }
    }
  },
  required: ['affectedPages', 'affectedLayouts', 'affectedComponents', 'mobilePattern', 'recommendation']
};

export const UIArchitectureSchema = {
  type: Type.OBJECT,
  properties: {
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          path: { type: Type.STRING },
          purpose: { type: Type.STRING },
          layoutType: { type: Type.STRING },
          componentNames: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['name', 'path', 'purpose', 'layoutType', 'componentNames']
      }
    },
    components: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          purpose: { type: Type.STRING },
          usageGuidelines: { type: Type.STRING }
        },
        required: ['name', 'type', 'purpose', 'usageGuidelines']
      }
    },
    styleSystem: {
      type: Type.OBJECT,
      properties: {
        colors: {
          type: Type.OBJECT,
          properties: {
            primary: { type: Type.STRING },
            secondary: { type: Type.STRING },
            accent: { type: Type.STRING },
            background: { type: Type.STRING },
            surface: { type: Type.STRING }
          },
          required: ['primary', 'secondary', 'accent', 'background', 'surface']
        },
        typography: {
          type: Type.OBJECT,
          properties: {
            fontSans: { type: Type.STRING },
            fontMono: { type: Type.STRING }
          },
          required: ['fontSans', 'fontMono']
        }
      },
      required: ['colors', 'typography']
    }
  },
  required: ['pages', 'components', 'styleSystem']
};
