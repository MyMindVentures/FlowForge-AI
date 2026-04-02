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
