import { LLMAdapter } from './LLMAdapter';
import { XAIAdapter } from './XAIAdapter';
import {
  ClassifyOptions,
  ClassifyResponse,
  AnalyzeOptions,
  AnalyzeResponse,
  EnhanceOptions,
  EnhanceResponse,
} from './types';
import { config } from '../../config';
import logger from '../../utils/logger';

export class LLMService {
  private adapter: LLMAdapter;
  private fallbackAdapter?: LLMAdapter;

  constructor(primaryAdapter: LLMAdapter, fallbackAdapter?: LLMAdapter) {
    this.adapter = primaryAdapter;
    this.fallbackAdapter = fallbackAdapter;
  }

  async classify(text: string, options: ClassifyOptions): Promise<ClassifyResponse> {
    try {
      return await this.adapter.classify(text, options);
    } catch (error: any) {
      if (this.fallbackAdapter && this.shouldFallback(error)) {
        logger.warn(`Primary provider failed: ${error.message}. Falling back...`);
        return await this.fallbackAdapter.classify(text, options);
      }
      throw error;
    }
  }

  async analyze(text: string, options: AnalyzeOptions): Promise<AnalyzeResponse> {
    try {
      return await this.adapter.analyze(text, options);
    } catch (error: any) {
      if (this.fallbackAdapter && this.shouldFallback(error)) {
        logger.warn(`Primary provider failed: ${error.message}. Falling back...`);
        return await this.fallbackAdapter.analyze(text, options);
      }
      throw error;
    }
  }

  async enhance(text: string, options: EnhanceOptions): Promise<EnhanceResponse> {
    try {
      return await this.adapter.enhance(text, options);
    } catch (error: any) {
      if (this.fallbackAdapter && this.shouldFallback(error)) {
        logger.warn(`Primary provider failed: ${error.message}. Falling back...`);
        return await this.fallbackAdapter.enhance(text, options);
      }
      throw error;
    }
  }

  private shouldFallback(error: any): boolean {
    const message = error.message || '';
    return (
      message.includes('429') ||
      message.includes('503') ||
      message.includes('timeout') ||
      message.includes('ECONNREFUSED')
    );
  }

  getCostEstimate(inputTokens: number, outputTokens: number): number {
    return this.adapter.calculateCost(inputTokens, outputTokens);
  }
}

// Factory function
export function createLLMService(): LLMService {
  const provider = config.llm.provider;
  const fallbackProvider = config.llm.fallbackProvider;

  const adapters: { [key: string]: LLMAdapter } = {
    xai: new XAIAdapter(),
    // Add more adapters here when needed
  };

  const primaryAdapter = adapters[provider];
  const fallbackAdapter = fallbackProvider ? adapters[fallbackProvider] : undefined;

  if (!primaryAdapter) {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }

  return new LLMService(primaryAdapter, fallbackAdapter);
}

// Export singleton instance
export const llmService = createLLMService();
