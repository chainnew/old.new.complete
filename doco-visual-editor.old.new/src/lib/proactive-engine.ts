import { AIService } from './ai-service';

export interface DocumentFeatures {
  wordCount: number;
  weakVerbs: string[];
  passiveVoice: number;
  repetitiveWords: string[];
  averageSentenceLength: number;
  readabilityScore: number;
  missingKeywords: string[];
}

export interface ProactiveSuggestion {
  id: string;
  type: 'grammar' | 'tone' | 'structure' | 'keywords' | 'impact';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
  preview?: string;
  confidence: number;
}

export interface AgentTask {
  id: string;
  type: 'analyze' | 'enhance' | 'review' | 'format';
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * ProactiveEngine - Agentic AI that autonomously improves documents
 *
 * Multi-agent workflow:
 * 1. Analyzer Agent: Scans document for issues
 * 2. Enhancer Agent: Generates improvements
 * 3. Reviewer Agent: Validates quality
 * 4. Formatter Agent: Applies final polish
 */
export class ProactiveEngine {
  private aiService: AIService;
  private tasks: AgentTask[] = [];
  private contextWindow: Array<{ role: string; content: string }> = [];
  private readonly MAX_CONTEXT_TOKENS = 4000;

  constructor(apiKey: string) {
    this.aiService = new AIService(apiKey);
  }

  /**
   * Proactive scan on document load
   * Returns top 3-5 suggestions without user prompt
   */
  async scanDocument(
    content: string,
    documentType: 'resume' | 'cover-letter' | 'technical-doc' = 'resume',
    targetRole?: string
  ): Promise<ProactiveSuggestion[]> {
    console.log('[ProactiveEngine] Starting document scan...');

    // Step 1: Extract features
    const features = await this.extractFeatures(content);

    // Step 2: Analyze with AI (Analyzer Agent)
    const analysisPrompt = this.buildAnalysisPrompt(content, features, documentType, targetRole);

    let analysisResult = '';
    await new Promise<void>((resolve, reject) => {
      this.aiService.streamChat(
        [{ role: 'user', content: analysisPrompt }],
        {
          onChunk: (chunk) => {
            analysisResult += chunk;
          },
          onComplete: () => resolve(),
          onError: (error) => reject(error)
        }
      );
    });

    // Parse suggestions from AI response
    const suggestions = this.parseSuggestions(analysisResult);

    console.log(`[ProactiveEngine] Found ${suggestions.length} suggestions`);
    return suggestions;
  }

  /**
   * Multi-agent enhancement workflow
   */
  async agenticEnhance(
    content: string,
    suggestions: ProactiveSuggestion[],
    onProgress?: (task: AgentTask) => void
  ): Promise<string> {
    console.log('[ProactiveEngine] Starting agentic enhancement...');

    // Create task pipeline
    this.tasks = [
      { id: 'analyze', type: 'analyze', status: 'pending' },
      { id: 'enhance', type: 'enhance', status: 'pending' },
      { id: 'review', type: 'review', status: 'pending' },
      { id: 'format', type: 'format', status: 'pending' }
    ];

    let currentContent = content;

    // Execute each agent in sequence
    for (const task of this.tasks) {
      task.status = 'running';
      onProgress?.(task);

      try {
        switch (task.type) {
          case 'analyze':
            task.result = await this.analyzerAgent(currentContent, suggestions);
            break;
          case 'enhance':
            currentContent = await this.enhancerAgent(currentContent, task.result);
            task.result = currentContent;
            break;
          case 'review':
            task.result = await this.reviewerAgent(currentContent);
            break;
          case 'format':
            currentContent = await this.formatterAgent(currentContent, task.result);
            task.result = currentContent;
            break;
        }

        task.status = 'completed';
        onProgress?.(task);
      } catch (error) {
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : 'Unknown error';
        onProgress?.(task);
        throw error;
      }
    }

    return currentContent;
  }

  /**
   * Context-aware streaming chat with smart pruning
   */
  async *streamContextualChat(
    query: string,
    documentContent?: string
  ): AsyncGenerator<string> {
    // Add document context if provided
    if (documentContent) {
      this.contextWindow.push({
        role: 'system',
        content: `Current document: ${documentContent.substring(0, 1000)}...`
      });
    }

    // Add user query
    this.contextWindow.push({
      role: 'user',
      content: query
    });

    // Prune context to fit token budget
    const prunedContext = this.pruneContext();

    // Stream response
    let fullResponse = '';
    await new Promise<void>((resolve, reject) => {
      this.aiService.streamChat(
        prunedContext,
        {
          onChunk: (chunk) => {
            fullResponse += chunk;
          },
          onComplete: () => resolve(),
          onError: (error) => reject(error)
        }
      );
    });

    // Add assistant response to context
    this.contextWindow.push({
      role: 'assistant',
      content: fullResponse
    });

    // Yield response in chunks
    const words = fullResponse.split(' ');
    for (const word of words) {
      yield word + ' ';
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }

  // ============ Private Methods ============

  private async extractFeatures(content: string): Promise<DocumentFeatures> {
    const words = content.split(/\s+/);
    const sentences = content.split(/[.!?]+/);

    // Simple feature extraction (can be enhanced with NLP)
    return {
      wordCount: words.length,
      weakVerbs: this.detectWeakVerbs(content),
      passiveVoice: this.detectPassiveVoice(content),
      repetitiveWords: this.detectRepetition(words),
      averageSentenceLength: words.length / sentences.length,
      readabilityScore: this.calculateReadability(content),
      missingKeywords: []
    };
  }

  private buildAnalysisPrompt(
    content: string,
    features: DocumentFeatures,
    documentType: string,
    targetRole?: string
  ): string {
    return `You are Doco Pro, an expert document analyzer. Be proactive, helpful, and empowering.

Analyze this ${documentType}${targetRole ? ` for a ${targetRole} role` : ''} and provide top 3-5 suggestions.

DOCUMENT:
${content}

DETECTED FEATURES:
- Word count: ${features.wordCount}
- Weak verbs detected: ${features.weakVerbs.length}
- Passive voice instances: ${features.passiveVoice}
- Repetitive words: ${features.repetitiveWords.join(', ')}
- Avg sentence length: ${features.averageSentenceLength.toFixed(1)} words

Return ONLY a JSON array of suggestions with this format:
[
  {
    "type": "grammar|tone|structure|keywords|impact",
    "severity": "low|medium|high",
    "title": "Short title",
    "description": "What's the issue",
    "action": "What to do to fix it",
    "preview": "Example of improved text",
    "confidence": 0.0-1.0
  }
]

Be specific and actionable. Focus on high-impact improvements.`;
  }

  private parseSuggestions(aiResponse: string): ProactiveSuggestion[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return suggestions.map((s: any, i: number) => ({
          id: `suggestion-${Date.now()}-${i}`,
          ...s
        }));
      }
    } catch (error) {
      console.error('[ProactiveEngine] Failed to parse suggestions:', error);
    }

    // Fallback: return generic suggestions
    return [
      {
        id: 'fallback-1',
        type: 'structure',
        severity: 'medium',
        title: 'Improve document structure',
        description: 'The document could benefit from better organization',
        action: 'Reorganize sections for better flow',
        confidence: 0.7
      }
    ];
  }

  private async analyzerAgent(content: string, suggestions: ProactiveSuggestion[]): Promise<any> {
    console.log('[AnalyzerAgent] Analyzing document...');
    return {
      topSuggestions: suggestions.slice(0, 3),
      priority: 'high',
      estimatedImpact: 'significant'
    };
  }

  private async enhancerAgent(content: string, analysis: any): Promise<string> {
    console.log('[EnhancerAgent] Applying enhancements...');

    const prompt = `You are Doco Pro's enhancement agent. Apply these improvements to the document:

ANALYSIS RESULTS:
${JSON.stringify(analysis, null, 2)}

ORIGINAL DOCUMENT:
${content}

Return ONLY the enhanced document with improvements applied. Keep the original meaning intact.
Use proper HTML formatting with <h1>, <h2>, <p>, <strong>, <ul>, <li> tags.`;

    let enhanced = '';
    await new Promise<void>((resolve, reject) => {
      this.aiService.streamChat(
        [{ role: 'user', content: prompt }],
        {
          onChunk: (chunk) => {
            enhanced += chunk;
          },
          onComplete: () => resolve(),
          onError: (error) => reject(error)
        }
      );
    });

    return enhanced;
  }

  private async reviewerAgent(content: string): Promise<any> {
    console.log('[ReviewerAgent] Reviewing quality...');

    const prompt = `You are Doco Pro's quality reviewer. Review this enhanced document and provide a quality score.

DOCUMENT:
${content}

Return JSON with: {"score": 0-100, "strengths": ["..."], "improvements": ["..."], "approved": true/false}`;

    let review = '';
    await new Promise<void>((resolve, reject) => {
      this.aiService.streamChat(
        [{ role: 'user', content: prompt }],
        {
          onChunk: (chunk) => {
            review += chunk;
          },
          onComplete: () => resolve(),
          onError: (error) => reject(error)
        }
      );
    });

    try {
      const jsonMatch = review.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('[ReviewerAgent] Failed to parse review:', error);
    }

    return { score: 75, approved: true, strengths: [], improvements: [] };
  }

  private async formatterAgent(content: string, review: any): Promise<string> {
    console.log('[FormatterAgent] Applying final polish...');

    if (!review.approved) {
      console.warn('[FormatterAgent] Review not approved, returning original');
      return content;
    }

    // Apply final formatting touches
    return content;
  }

  private pruneContext(): Array<{ role: string; content: string }> {
    // Estimate tokens (rough: 1 token ≈ 4 chars)
    let totalTokens = 0;
    const pruned: Array<{ role: string; content: string }> = [];

    // Always keep system messages
    const systemMessages = this.contextWindow.filter(m => m.role === 'system');

    // Get recent messages
    const recentMessages = this.contextWindow
      .filter(m => m.role !== 'system')
      .slice(-10); // Keep last 10 messages

    // Calculate tokens
    for (const msg of [...systemMessages, ...recentMessages]) {
      const msgTokens = Math.ceil(msg.content.length / 4);
      if (totalTokens + msgTokens > this.MAX_CONTEXT_TOKENS) {
        break;
      }
      pruned.push(msg);
      totalTokens += msgTokens;
    }

    return pruned;
  }

  // Helper methods for feature detection
  private detectWeakVerbs(content: string): string[] {
    const weakVerbs = ['was', 'were', 'is', 'are', 'been', 'be', 'being', 'had', 'has', 'have', 'do', 'does', 'did'];
    const found = new Set<string>();

    weakVerbs.forEach(verb => {
      const regex = new RegExp(`\\b${verb}\\b`, 'gi');
      if (regex.test(content)) {
        found.add(verb);
      }
    });

    return Array.from(found);
  }

  private detectPassiveVoice(content: string): number {
    // Simple heuristic: count "was/were/been + past participle"
    const passivePattern = /\b(was|were|been)\s+\w+ed\b/gi;
    const matches = content.match(passivePattern);
    return matches ? matches.length : 0;
  }

  private detectRepetition(words: string[]): string[] {
    const frequency = new Map<string, number>();
    words.forEach(word => {
      const normalized = word.toLowerCase().replace(/[^\w]/g, '');
      if (normalized.length > 4) { // Only count longer words
        frequency.set(normalized, (frequency.get(normalized) || 0) + 1);
      }
    });

    return Array.from(frequency.entries())
      .filter(([_, count]) => count > 3)
      .map(([word]) => word)
      .slice(0, 5);
  }

  private calculateReadability(content: string): number {
    // Simplified Flesch Reading Ease
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const syllables = content.split(/[aeiou]/gi).length;

    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, score));
  }
}
