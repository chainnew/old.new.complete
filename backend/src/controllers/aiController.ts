import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { llmService } from '../services/llm/LLMService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Stream chat with AI
 */
export async function streamChat(req: AuthRequest, res: Response) {
  try {
    const { messages } = req.body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build context from messages
    const lastMessage = messages[messages.length - 1];
    const conversationHistory = messages
      .slice(0, -1)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are Doco, a helpful AI assistant for document editing and enhancement.
You help users improve their documents with grammar, clarity, structure, and tone.
Be concise, friendly, and professional.

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ''}`;

    try {
      const result = await llmService.enhance(lastMessage.content, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1000,
      });

      // Stream response
      const fullResponse = result.enhancedText || 'I apologize, but I encountered an issue. Please try again.';

      // Send response in chunks for streaming effect
      const words = fullResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        res.write(`data: ${JSON.stringify({ content: word })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      console.error('AI chat error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (error) {
    console.error('Stream chat error:', error);
    res.status(500).json({ error: 'Chat failed' });
  }
}

/**
 * Get AI suggestions for document improvements
 */
export async function getSuggestions(req: AuthRequest, res: Response) {
  try {
    const { text, context } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const systemPrompt = `You are an AI editor. Analyze the following text and provide 3-5 specific, actionable suggestions for improvement.
Focus on: grammar, clarity, structure, tone, and readability.
${context ? `\n\nContext: ${context}` : ''}

Format your response as a JSON array of strings, each being one suggestion.`;

    const result = await llmService.enhance(text.slice(0, 1000), {
      systemPrompt,
      temperature: 0.5,
      maxTokens: 500,
    });

    // Try to parse suggestions from response
    let suggestions: string[] = [];
    try {
      const responseText = result.enhancedText || '';
      // Look for JSON array in response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by newlines or numbered items
        suggestions = responseText
          .split('\n')
          .filter((line) => line.trim().length > 10)
          .slice(0, 5);
      }
    } catch {
      // Fallback suggestions
      suggestions = [
        'Consider breaking long sentences into shorter ones for better readability',
        'Review passive voice usage and convert to active where appropriate',
        'Check for consistency in tone throughout the document',
      ];
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
}

/**
 * Quick grammar check
 */
export async function grammarCheck(req: AuthRequest, res: Response) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const systemPrompt = `You are a grammar and spelling checker. Identify and list all grammar, spelling, and punctuation errors in the following text.
Return a JSON array of objects with: { "error": "description", "suggestion": "fix", "location": "text snippet" }`;

    const result = await llmService.enhance(text.slice(0, 2000), {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 800,
    });

    let errors: any[] = [];
    try {
      const responseText = result.enhancedText || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        errors = JSON.parse(jsonMatch[0]);
      }
    } catch {
      errors = [];
    }

    res.json({ errors, count: errors.length });
  } catch (error) {
    console.error('Grammar check error:', error);
    res.status(500).json({ error: 'Grammar check failed' });
  }
}

export const aiController = {
  streamChat,
  getSuggestions,
  grammarCheck,
};
