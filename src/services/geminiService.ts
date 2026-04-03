import { GoogleGenAI, Type } from "@google/genai";
import { Suggestion, Feature, Comment, Project, UsageLog, ErrorLog } from "../types";
import { collection, addDoc, serverTimestamp } from "../lib/db/supabaseData";
import { db, auth } from "../lib/supabase/appClient";
import { handleDataOperationError, DataOperationType } from "../lib/databaseErrorHandler";

const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) {
    console.warn('Error accessing API key', e);
  }
  return '';
};

const getAI = () => new GoogleGenAI({ apiKey: getApiKey() });

const safeJsonParse = (text: string | undefined, defaultVal: any) => {
  if (!text) return defaultVal;
  try {
    const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('Failed to parse JSON response:', text);
    return defaultVal;
  }
};

async function logAIUsage(projectId: string, model: string, prompt: string, response: string, tokens: number = 0) {
  if (!auth.currentUser) return;
  try {
    const usage: Omit<UsageLog, 'id'> = {
      userId: auth.currentUser.uid,
      projectId,
      modelId: model,
      promptTokens: tokens, // Assuming tokens is prompt tokens for now
      completionTokens: 0,
      totalTokens: tokens,
      cost: 0,
      latency: 0,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, 'admin', 'ai', 'usage'), usage);
  } catch (error) {
    try {
      handleDataOperationError(error, DataOperationType.CREATE, 'admin/ai/usage');
    } catch (e) {
      console.error('Failed to log AI usage', e);
    }
  }
}

async function logAIError(projectId: string, model: string, errorCode: string, errorMessage: string) {
  if (!auth.currentUser) return;
  try {
    const errorLog: Omit<ErrorLog, 'id'> = {
      userId: auth.currentUser.uid,
      projectId,
      modelId: model,
      errorCode,
      errorMessage,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, 'admin', 'ai', 'errors'), errorLog);
  } catch (error) {
    try {
      handleDataOperationError(error, DataOperationType.CREATE, 'admin/ai/errors');
    } catch (e) {
      console.error('Failed to log AI error', e);
    }
  }
}

async function withRetry<T>(fn: () => Promise<T>, projectId: string, model: string, retries: number = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`AI call failed (attempt ${i + 1}/${retries}):`, error);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  try {
    await logAIError(projectId, model, 'RETRY_EXHAUSTED', lastError?.message || 'Unknown error');
  } catch (e) {
    console.error('Failed to log AI error', e);
  }
  throw lastError;
}

export async function generateSuggestions(
  prompt: string, 
  projectContext: { id: string, name: string, description: string },
  existingFeatures: Feature[] = []
): Promise<Omit<Suggestion, 'id' | 'projectId' | 'status' | 'timestamp' | 'sessionId'>[]> {
  const modelId = "gemini-3-flash-preview";
  const systemPrompt = `You are an AI product strategist.
    
    App Context:
    Project Name: ${projectContext.name}
    Project Description: ${projectContext.description}
    
    Existing Features (Avoid Duplicates):
    ${existingFeatures.map(f => `- ${f.title}: ${f.nonTechnicalDescription}`).join('\n')}
    
    Input Idea: ${prompt}
    
    Steps:
    1. Load and analyze the full app context and existing features.
    2. Generate exactly 5 structured feature suggestions that align with the project goals.
    
    Each suggestion must include:
    - title: A clear, concise name for the feature.
    - problem: The specific problem this feature solves.
    - solution: How the feature solves the problem (concise and actionable).
    - userValue: Why this is valuable to the user.
    - scope: One of "Small", "Medium", "Large".
    
    Constraints:
    - Align strictly with the existing app context.
    - Avoid duplicates with existing features.
    - Focus on high product value.
    
    Output exactly 5 feature cards in JSON format.`;

  return withRetry(async () => {
    const response = await getAI().models.generateContent({
      model: modelId,
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              problem: { type: Type.STRING },
              solution: { type: Type.STRING },
              userValue: { type: Type.STRING },
              scope: { type: Type.STRING, enum: ["Small", "Medium", "Large"] }
            },
            required: ["title", "problem", "solution", "userValue", "scope"]
          }
        }
      }
    });

    const text = response.text;
    await logAIUsage(projectContext.id, modelId, prompt, text || '');
    return safeJsonParse(text, []);
  }, projectContext.id, modelId);
}

export async function generateFeatureDetails(projectId: string, suggestion: Partial<Suggestion>): Promise<{
  problem: string;
  solution: string;
  why: string;
  nonTechnicalDescription: string;
  technicalDescription: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  comments: Omit<Comment, 'id' | 'featureId' | 'createdAt'>[];
}> {
  const modelId = "gemini-3-flash-preview";
  const prompt = `You are a dual-role AI: a Product Architect and a Technical Builder.
    Based on this approved feature suggestion, generate a detailed Feature Card.
    
    Suggestion:
    Title: ${suggestion.title}
    Problem: ${suggestion.problem}
    Solution: ${suggestion.solution}
    User Value: ${suggestion.userValue}
    Scope: ${suggestion.scope}
    
    Requirements:
    1. problem: The core problem being addressed.
    2. solution: The proposed solution.
    3. why: The strategic "why" behind this feature (value proposition).
    4. nonTechnicalDescription: A clear, simple explanation for non-tech stakeholders.
    5. technicalDescription: A detailed technical breakdown for developers (UI, data, logic).
    6. priority: Assign a priority (Low, Medium, High, Critical) based on the scope and user value.
    7. comments: 2 to 4 realistic comments (open questions, decisions needed, missing definitions).`;

  return withRetry(async () => {
    const response = await getAI().models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem: { type: Type.STRING },
            solution: { type: Type.STRING },
            why: { type: Type.STRING },
            nonTechnicalDescription: { type: Type.STRING },
            technicalDescription: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            comments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  authorRole: { type: Type.STRING, enum: ["Architect", "Builder"] },
                  content: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Question", "Decision", "Definition"] }
                },
                required: ["authorRole", "content", "type"]
              }
            }
          },
          required: ["problem", "solution", "why", "nonTechnicalDescription", "technicalDescription", "priority", "comments"]
        }
      }
    });

    const text = response.text;
    await logAIUsage(projectId, modelId, prompt, text || '');
    return safeJsonParse(text, {});
  }, projectId, modelId);
}

export async function generateReleaseNotes(versionName: string, goal: string, features: Feature[]): Promise<string> {
  const response = await getAI().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a product manager writing release notes for version ${versionName}.
    
    Goal of this release: ${goal}
    
    Features included:
    ${features.map(f => `- ${f.title}: ${f.nonTechnicalDescription}`).join('\n')}
    
    Generate professional, engaging release notes in Markdown format.
    Include:
    - A brief summary of the release.
    - A section for "What's New" highlighting the key features.
    - A section for "Improvements" if applicable.
    - A closing statement about the impact of this release.`,
    config: {
      temperature: 0.7,
    }
  });

  return response.text || "Failed to generate release notes.";
}

export async function generateProjectDocumentation(project: Project, features: Feature[]): Promise<{
  prd: string;
  conceptSummary: string;
  tagline: string;
}> {
  const response = await getAI().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an AI documentation generator.
    Based on the following project and its completed features, generate a comprehensive PRD, an app concept summary, and a punchy tagline.
    
    Project: ${project.name}
    Description: ${project.description}
    
    Completed Features:
    ${features.filter(f => f.status === 'Completed').map(f => `- ${f.title}: ${f.nonTechnicalDescription}`).join('\n')}
    
    Requirements:
    1. PRD (Product Requirements Document): Structured with sections like Overview, Target Audience, Key Features (detailed), and Future Roadmap.
    2. App Concept Summary: A 2-3 paragraph high-level vision of what the app has become.
    3. Tagline: A single, memorable sentence that captures the essence of the project.
    
    Output in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prd: { type: Type.STRING, description: "Markdown formatted PRD" },
          conceptSummary: { type: Type.STRING },
          tagline: { type: Type.STRING }
        },
        required: ["prd", "conceptSummary", "tagline"]
      }
    }
  });

  return safeJsonParse(response.text, { prd: '', conceptSummary: '', tagline: '' });
}

export async function generateMarketingKit(project: Project, features: Feature[]): Promise<{
  taglines: string[];
  valuePropositions: { title: string; description: string }[];
  pitchNarrative: string;
  marketingCopy: { headline: string; body: string }[];
}> {
  const response = await getAI().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a high-end marketing AI and venture capital strategist.
    Based on the following project and its features, generate a comprehensive marketing kit.
    
    Project: ${project.name}
    Description: ${project.description}
    
    Features:
    ${features.map(f => `- ${f.title}: ${f.nonTechnicalDescription}`).join('\n')}
    
    Requirements:
    1. Taglines: 5 punchy, memorable taglines (short, medium, and long).
    2. Value Propositions: 3 core value propositions with a title and a brief description.
    3. Pitch Narrative: A 3-paragraph investor-friendly narrative that tells the story of the problem, the solution, and the market impact.
    4. Marketing Copy: 3 distinct copy blocks (e.g., for a landing page, an email, or a social post) with a headline and body.
    
    Tone: Professional, ambitious, and investor-friendly.
    Output in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          taglines: { type: Type.ARRAY, items: { type: Type.STRING } },
          valuePropositions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["title", "description"]
            }
          },
          pitchNarrative: { type: Type.STRING },
          marketingCopy: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                body: { type: Type.STRING }
              },
              required: ["headline", "body"]
            }
          }
        },
        required: ["taglines", "valuePropositions", "pitchNarrative", "marketingCopy"]
      }
    }
  });

  return safeJsonParse(response.text, { taglines: [], valuePropositions: [], pitchNarrative: '', marketingCopy: [] });
}

export async function generateAssetTags(assetName: string, assetType: string, projectContext: { name: string, description: string }): Promise<string[]> {
  const response = await getAI().models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an AI asset manager.
    Based on the asset name, type, and project context, generate 5-8 relevant tags for this asset.
    
    Project: ${projectContext.name}
    Description: ${projectContext.description}
    
    Asset Name: ${assetName}
    Asset Type: ${assetType}
    
    Output exactly a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return safeJsonParse(response.text, []);
}


