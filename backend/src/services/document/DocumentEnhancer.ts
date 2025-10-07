import { llmService } from '../llm/LLMService';
import { EnhanceResponse } from '../llm/types';
import { diffWords } from 'diff';
import logger from '../../utils/logger';

export type EnhancementLevel = 'quick' | 'professional' | 'premium';

interface EnhanceParams {
  text: string;
  level: EnhancementLevel;
  documentType?: string;
  industry?: string;
  audience?: string;
  tone?: string;
  specialInstructions?: string;
}

const ENHANCEMENT_CONFIGS = {
  quick: {
    maxTokens: 3000,
    temperature: 0.3,
    price: 5,
  },
  professional: {
    maxTokens: 5000,
    temperature: 0.5,
    price: 15,
  },
  premium: {
    maxTokens: 8000,
    temperature: 0.7,
    price: 30,
  },
};

export class DocumentEnhancer {
  async enhance(params: EnhanceParams): Promise<EnhanceResponse & { cost: number }> {
    logger.info('Enhancing document', {
      level: params.level,
      textLength: params.text.length,
      documentType: params.documentType,
    });

    const config = ENHANCEMENT_CONFIGS[params.level];
    const systemPrompt = this.buildPrompt(params);

    const startTime = Date.now();

    try {
      const result = await llmService.enhance(params.text, {
        systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        documentType: params.documentType,
        industry: params.industry,
        audience: params.audience,
        tone: params.tone,
        specialInstructions: params.specialInstructions,
      });

      const processingTime = Date.now() - startTime;
      const cost = llmService.getCostEstimate(
        result.tokensUsed.input,
        result.tokensUsed.output
      );

      logger.info('Document enhanced', {
        level: params.level,
        changes: result.changes?.length || 0,
        processingTime,
        cost,
      });

      return {
        ...result,
        cost,
      };
    } catch (error) {
      logger.error('Enhancement failed', { error });
      throw error;
    }
  }

  private buildPrompt(params: EnhanceParams): string {
    const { level, documentType, industry, audience, tone, specialInstructions } = params;

    let basePrompt = `You are an expert document editor and enhancer. Your task is to improve the following document while maintaining its core message and structure.

Enhancement Level: ${level.toUpperCase()}`;

    if (level === 'quick') {
      basePrompt += `

Focus on:
- Grammar and spelling corrections
- Basic sentence structure improvements
- Readability enhancements
- Basic formatting fixes

Return JSON with:
{
  "enhancedText": "the improved document text",
  "changes": [
    {
      "type": "grammar|style|clarity",
      "original": "original text",
      "enhanced": "improved text",
      "reason": "explanation",
      "location": {"start": 0, "end": 10}
    }
  ],
  "summary": {
    "totalChanges": 10,
    "improvementScore": 25
  }
}`;
    } else if (level === 'professional') {
      basePrompt += `

Focus on:
- All Quick features
- Tone adjustment for target audience
- Structure optimization
- Technical accuracy review
- Industry terminology enhancement
- Redundancy removal
- Transition improvements`;
    } else {
      basePrompt += `

Focus on:
- All Professional features
- Deep content restructuring
- Data-driven insights
- Strategic positioning advice
- Expert-level industry standards
- Multiple revision iterations`;
    }

    if (documentType) {
      basePrompt += `\n\nDocument Type: ${documentType}`;
    }

    if (industry) {
      basePrompt += `\n\nIndustry: ${industry}
- Use industry-specific terminology appropriately
- Align with industry standards and best practices`;
    }

    if (audience) {
      basePrompt += `\n\nTarget Audience: ${audience}
- Adjust complexity and terminology for this audience
- Use appropriate formality level`;
    }

    if (tone) {
      basePrompt += `\n\nDesired Tone: ${tone}`;
    }

    if (specialInstructions) {
      basePrompt += `\n\nSpecial Instructions: ${specialInstructions}`;
    }

    basePrompt += `\n\nIMPORTANT: Return ONLY valid JSON. Do not include any explanatory text before or after the JSON.`;

    return basePrompt;
  }

  generateTrackChanges(original: string, enhanced: string): Array<{
    type: string;
    original: string;
    enhanced: string;
    reason: string;
    location: { start: number; end: number };
  }> {
    const changes: Array<{
      type: string;
      original: string;
      enhanced: string;
      reason: string;
      location: { start: number; end: number };
    }> = [];

    const diff = diffWords(original, enhanced);
    let position = 0;

    diff.forEach((part) => {
      if (part.added || part.removed) {
        const change = {
          type: 'modification',
          original: part.removed ? part.value : '',
          enhanced: part.added ? part.value : '',
          reason: 'Text modification',
          location: {
            start: position,
            end: position + part.value.length,
          },
        };
        changes.push(change);
      }
      if (!part.removed) {
        position += part.value.length;
      }
    });

    return changes;
  }
}

export const documentEnhancer = new DocumentEnhancer();
