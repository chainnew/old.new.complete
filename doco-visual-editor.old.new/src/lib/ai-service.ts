export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIStreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export class AIService {
  private apiKey: string;
  private baseURL: string;
  private model: string;
  private abortController: AbortController | null = null;

  constructor(apiKey: string, provider: 'openai' | 'anthropic' | 'xai' = 'xai') {
    this.apiKey = apiKey;

    // Use xAI Grok by default
    if (provider === 'xai') {
      this.baseURL = import.meta.env.VITE_XAI_API_ENDPOINT || 'https://api.x.ai/v1/chat/completions';
      this.model = import.meta.env.VITE_XAI_MODEL || 'grok-beta';
    } else if (provider === 'openai') {
      this.baseURL = 'https://api.openai.com/v1/chat/completions';
      this.model = 'gpt-4-turbo-preview';
    } else {
      this.baseURL = 'https://api.anthropic.com/v1/messages';
      this.model = 'claude-3-opus-20240229';
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async streamChat(messages: AIMessage[], callbacks: AIStreamCallbacks): Promise<void> {
    // Create new abort controller for this request
    this.abortController = new AbortController();

    try {
      console.log('DEBUG - AI Service Config:', {
        baseURL: this.baseURL,
        model: this.model,
        apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'null',
      });

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
        }),
        signal: this.abortController.signal,
      });

      console.log('DEBUG - Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('DEBUG - API Error Response:', errorBody);

        // Try to parse error details
        let errorDetails = errorBody;
        try {
          const errorJson = JSON.parse(errorBody);
          errorDetails = JSON.stringify(errorJson, null, 2);
        } catch {
          // Not JSON, use as-is
        }

        throw new Error(`API request failed [${response.status}]: ${errorDetails}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                callbacks.onChunk(content);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      callbacks.onComplete(fullText);
    } catch (error) {
      callbacks.onError(error as Error);
    }
  }

  async mockStream(prompt: string, callbacks: AIStreamCallbacks): Promise<void> {
    const responses: Record<string, string> = {
      grammar: "I've reviewed your document and found a few areas to improve:\n\n1. Fixed several spelling errors\n2. Corrected punctuation issues\n3. Improved sentence structure\n\nYour document now reads more professionally!",
      clarity: "I've made your text clearer by:\n\n- Using simpler language\n- Breaking down complex sentences\n- Adding transitions between ideas\n\nThe document should now be easier to understand.",
      professional: "I've rewritten the content in a more professional tone:\n\n- Removed casual language\n- Used industry-standard terminology\n- Structured paragraphs formally\n\nThe document now has a more polished, business-appropriate style.",
      structure: "I've organized your document with clear sections:\n\n## Introduction\nOverview of the main topic\n\n## Main Points\nDetailed discussion of key ideas\n\n## Conclusion\nSummary and next steps\n\nThe document is now well-structured and easy to navigate.",
      default: "I'm here to help! I can assist with:\n\n- Grammar and spelling corrections\n- Improving clarity and readability\n- Adjusting tone and style\n- Organizing content into sections\n- Generating new content\n\nWhat would you like me to do?",
    };

    const promptLower = prompt.toLowerCase();
    let response = responses.default;

    if (promptLower.includes('grammar') || promptLower.includes('spelling')) {
      response = responses.grammar;
    } else if (promptLower.includes('clarity') || promptLower.includes('understand')) {
      response = responses.clarity;
    } else if (promptLower.includes('professional') || promptLower.includes('tone')) {
      response = responses.professional;
    } else if (promptLower.includes('structure') || promptLower.includes('section')) {
      response = responses.structure;
    }

    const words = response.split(' ');
    let fullText = '';

    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      fullText += word;
      callbacks.onChunk(word);
    }

    callbacks.onComplete(fullText);
  }
}
