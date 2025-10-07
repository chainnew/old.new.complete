import {
  ClassifyOptions,
  ClassifyResponse,
  AnalyzeOptions,
  AnalyzeResponse,
  EnhanceOptions,
  EnhanceResponse,
  StandardResponse,
} from './types';

export abstract class LLMAdapter {
  abstract classify(text: string, options: ClassifyOptions): Promise<ClassifyResponse>;
  abstract analyze(text: string, options: AnalyzeOptions): Promise<AnalyzeResponse>;
  abstract enhance(text: string, options: EnhanceOptions): Promise<EnhanceResponse>;
  abstract calculateCost(inputTokens: number, outputTokens: number): number;
  abstract normalizeResponse(rawResponse: any): StandardResponse;
}
