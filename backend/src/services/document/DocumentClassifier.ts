import { llmService } from '../llm/LLMService';
import { ClassifyResponse } from '../llm/types';
import logger from '../../utils/logger';

const CLASSIFICATION_PROMPT = `You are an expert document classifier that works across multiple languages.

Classify the following document into one of these types:
- resume / CV
- cover_letter
- business_proposal
- research_paper
- technical_report
- blog_post
- marketing_copy
- email
- whitepaper
- case_study
- business_plan
- grant_proposal
- thesis
- essay
- other

For each document, identify:
1. Document type (from the list above)
2. Confidence score (0.0 to 1.0)
3. Subtype (if applicable)
4. Industry (if applicable)
5. Target audience (if applicable)
6. Suggested tone (professional, casual, academic, persuasive, etc.)

If the document is not in English:
- First identify the language
- Then classify the document type
- Add cultural/regional considerations in multilingualNote

Return your response as JSON in this exact format:
{
  "type": "document_type",
  "confidence": 0.95,
  "subtype": "optional_subtype",
  "industry": "optional_industry",
  "audience": "target_audience",
  "suggestedTone": "tone",
  "detectedLanguage": "en",
  "multilingualNote": "optional language-specific guidance"
}`;

export class DocumentClassifier {
  async classify(text: string, detectedLanguage: string = 'en'): Promise<ClassifyResponse> {
    logger.info('Classifying document', { textLength: text.length, detectedLanguage });

    const excerpt = text.substring(0, 2000);

    try {
      const result = await llmService.classify(excerpt, {
        systemPrompt: CLASSIFICATION_PROMPT,
        temperature: 0.3,
        maxTokens: 500,
      });

      logger.info('Document classified', { type: result.type, confidence: result.confidence });
      return result;
    } catch (error) {
      logger.error('Classification failed, using heuristic fallback', { error });
      return this.heuristicClassify(text);
    }
  }

  private heuristicClassify(text: string): ClassifyResponse {
    const lowerText = text.toLowerCase();

    // Simple keyword-based classification
    if (
      lowerText.includes('resume') ||
      lowerText.includes('education') && lowerText.includes('experience')
    ) {
      return this.createResponse('resume', 0.7);
    }

    if (lowerText.includes('dear hiring manager') || lowerText.includes('sincerely')) {
      return this.createResponse('cover_letter', 0.7);
    }

    if (lowerText.includes('proposal') || lowerText.includes('budget')) {
      return this.createResponse('business_proposal', 0.6);
    }

    if (lowerText.includes('abstract') && lowerText.includes('references')) {
      return this.createResponse('research_paper', 0.7);
    }

    if (lowerText.includes('introduction') && lowerText.includes('conclusion')) {
      return this.createResponse('essay', 0.6);
    }

    return this.createResponse('other', 0.5);
  }

  private createResponse(
    type: string,
    confidence: number,
    additionalProps: Partial<ClassifyResponse> = {}
  ): ClassifyResponse {
    return {
      type,
      confidence,
      suggestedTone: 'professional',
      detectedLanguage: 'en',
      content: JSON.stringify({ type, confidence }),
      tokensUsed: { input: 0, output: 0, total: 0 },
      model: 'heuristic',
      provider: 'xai',
      ...additionalProps,
    };
  }
}

export const documentClassifier = new DocumentClassifier();
