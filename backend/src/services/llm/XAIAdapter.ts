import { LLMAdapter } from './LLMAdapter';
import {
  ClassifyOptions,
  ClassifyResponse,
  AnalyzeOptions,
  AnalyzeResponse,
  EnhanceOptions,
  EnhanceResponse,
  StandardResponse,
} from './types';
import { config } from '../../config';
import logger from '../../utils/logger';

export class XAIAdapter extends LLMAdapter {
  private apiKey: string;
  private endpoint: string;
  private model: string;

  constructor() {
    super();
    this.apiKey = config.xai.apiKey;
    this.endpoint = config.xai.endpoint;
    this.model = config.xai.model;

    if (!this.apiKey) {
      throw new Error('XAI_API_KEY is not configured');
    }
  }

  async classify(text: string, options: ClassifyOptions): Promise<ClassifyResponse> {
    const response = await this.makeRequest({
      systemPrompt: options.systemPrompt,
      userPrompt: text,
      temperature: options.temperature || 0.3,
      maxTokens: options.maxTokens || 500,
    });

    const standardResponse = this.normalizeResponse(response);

    try {
      const parsed = JSON.parse(standardResponse.content);
      return {
        ...standardResponse,
        ...parsed,
      } as ClassifyResponse;
    } catch (error) {
      logger.error('Failed to parse classification response', { error, content: standardResponse.content });
      throw new Error('Invalid classification response format');
    }
  }

  async analyze(text: string, options: AnalyzeOptions): Promise<AnalyzeResponse> {
    const response = await this.makeRequest({
      systemPrompt: options.systemPrompt,
      userPrompt: text,
      temperature: options.temperature || 0.3,
      maxTokens: options.maxTokens || 1000,
    });

    const standardResponse = this.normalizeResponse(response);

    try {
      const parsed = JSON.parse(standardResponse.content);
      return {
        ...standardResponse,
        ...parsed,
      } as AnalyzeResponse;
    } catch (error) {
      logger.error('Failed to parse analysis response', { error, content: standardResponse.content });
      throw new Error('Invalid analysis response format');
    }
  }

  async enhance(text: string, options: EnhanceOptions): Promise<EnhanceResponse> {
    const response = await this.makeRequest({
      systemPrompt: options.systemPrompt,
      userPrompt: text,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    const standardResponse = this.normalizeResponse(response);

    try {
      const parsed = JSON.parse(standardResponse.content);
      return {
        ...standardResponse,
        ...parsed,
      } as EnhanceResponse;
    } catch (error) {
      logger.error('Failed to parse enhancement response', { error, content: standardResponse.content });
      throw new Error('Invalid enhancement response format');
    }
  }

  private async makeRequest(params: {
    systemPrompt: string;
    userPrompt: string;
    temperature: number;
    maxTokens: number;
  }): Promise<any> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt },
          ],
          temperature: params.temperature,
          max_tokens: params.maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('XAI API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`XAI API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('XAI request failed', { error });
      throw error;
    }
  }

  calculateCost(inputTokens: number, outputTokens: number): number {
    // XAI Grok pricing: $0.20 per 1M input tokens, $0.50 per 1M output tokens
    const inputCost = (inputTokens / 1_000_000) * 0.20;
    const outputCost = (outputTokens / 1_000_000) * 0.50;
    return inputCost + outputCost;
  }

  normalizeResponse(rawResponse: any): StandardResponse {
    return {
      content: rawResponse.choices[0].message.content,
      tokensUsed: {
        input: rawResponse.usage.prompt_tokens,
        output: rawResponse.usage.completion_tokens,
        total: rawResponse.usage.total_tokens,
      },
      model: rawResponse.model,
      provider: 'xai',
    };
  }
}
