import { llmService } from '../llm/LLMService';
import { AnalyzeResponse } from '../llm/types';
import logger from '../../utils/logger';

const ANALYSIS_PROMPT = `You are an expert document analyst. Analyze the following document for:

1. Readability score (0-100 scale, where 100 is most readable)
2. Clarity score (0-100 scale)
3. Number of grammar issues found
4. Sentence complexity (simple, moderate, complex)
5. Average sentence length
6. Percentage of passive voice usage
7. Technical level (basic, intermediate, advanced)
8. 3-5 key strengths
9. 3-5 key weaknesses
10. 5-7 actionable improvement suggestions

Return your response as JSON in this exact format:
{
  "readabilityScore": 75,
  "clarityScore": 80,
  "grammarIssues": 12,
  "sentenceComplexity": "moderate",
  "avgSentenceLength": 18.5,
  "passiveVoicePercentage": 15.2,
  "technicalLevel": "intermediate",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

export class DocumentAnalyzer {
  async analyze(text: string): Promise<AnalyzeResponse> {
    logger.info('Analyzing document', { textLength: text.length });

    const excerpt = text.substring(0, 5000);

    try {
      const result = await llmService.analyze(excerpt, {
        systemPrompt: ANALYSIS_PROMPT,
        temperature: 0.3,
        maxTokens: 1000,
      });

      logger.info('Document analyzed', {
        readability: result.readabilityScore,
        clarity: result.clarityScore,
      });
      return result;
    } catch (error) {
      logger.error('Analysis failed, using heuristic fallback', { error });
      return this.heuristicAnalyze(text);
    }
  }

  private heuristicAnalyze(text: string): AnalyzeResponse {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const avgSentenceLength = words.length / sentences.length;

    // Simple passive voice detection
    const passiveIndicators = text.match(/\b(was|were|been|is|are|am)\s+\w+ed\b/gi) || [];
    const passiveVoicePercentage = (passiveIndicators.length / sentences.length) * 100;

    let complexity = 'moderate';
    if (avgSentenceLength < 15) complexity = 'simple';
    if (avgSentenceLength > 25) complexity = 'complex';

    let technicalLevel = 'intermediate';
    const technicalWords = text.match(/\b[A-Z]{2,}\b|\b\w{12,}\b/g) || [];
    if (technicalWords.length > 20) technicalLevel = 'advanced';
    if (technicalWords.length < 5) technicalLevel = 'basic';

    const readabilityScore = Math.max(
      0,
      Math.min(100, 100 - avgSentenceLength * 2 - passiveVoicePercentage)
    );

    return {
      readabilityScore: Math.round(readabilityScore),
      clarityScore: 70,
      grammarIssues: 0,
      sentenceComplexity: complexity,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      passiveVoicePercentage: Math.round(passiveVoicePercentage * 10) / 10,
      technicalLevel,
      strengths: ['Document structure is clear'],
      weaknesses: ['Consider breaking up longer sentences'],
      suggestions: ['Review for passive voice usage', 'Simplify complex sentences'],
      content: JSON.stringify({ readabilityScore }),
      tokensUsed: { input: 0, output: 0, total: 0 },
      model: 'heuristic',
      provider: 'xai',
    };
  }
}

export const documentAnalyzer = new DocumentAnalyzer();
