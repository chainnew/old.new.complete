export interface StandardResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
  provider: 'xai' | 'openai';
}

export interface ClassifyOptions {
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ClassifyResponse extends StandardResponse {
  type: string;
  confidence: number;
  subtype?: string;
  industry?: string;
  audience?: string;
  suggestedTone?: string;
  detectedLanguage?: string;
  multilingualNote?: string;
}

export interface AnalyzeOptions {
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AnalyzeResponse extends StandardResponse {
  readabilityScore: number;
  clarityScore: number;
  grammarIssues: number;
  sentenceComplexity: string;
  avgSentenceLength: number;
  passiveVoicePercentage: number;
  technicalLevel: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface EnhanceOptions {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  documentType?: string;
  industry?: string;
  audience?: string;
  tone?: string;
  specialInstructions?: string;
}

export interface EnhanceResponse extends StandardResponse {
  enhancedText: string;
  changes: Array<{
    type: string;
    original: string;
    enhanced: string;
    reason: string;
    location: { start: number; end: number };
  }>;
  summary: {
    totalChanges: number;
    improvementScore: number;
  };
}

export interface CompletionParams {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface CompletionResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
}
