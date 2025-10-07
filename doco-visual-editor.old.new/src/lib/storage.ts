import type { Document, Message } from '../types';

const DOCUMENT_KEY = 'doco_document';
const CHAT_KEY = 'doco_chat';
const API_KEY = 'doco_api_key';

export const storage = {
  saveDocument(document: Document): void {
    try {
      localStorage.setItem(DOCUMENT_KEY, JSON.stringify(document));
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  },

  loadDocument(): Document | null {
    try {
      const data = localStorage.getItem(DOCUMENT_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load document:', error);
      return null;
    }
  },

  saveChatHistory(messages: Message[]): void {
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  },

  loadChatHistory(): Message[] {
    try {
      const data = localStorage.getItem(CHAT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  },

  saveApiKey(key: string): void {
    try {
      localStorage.setItem(API_KEY, key);
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  },

  loadApiKey(): string | null {
    try {
      return localStorage.getItem(API_KEY);
    } catch (error) {
      console.error('Failed to load API key:', error);
      return null;
    }
  },

  clearAll(): void {
    try {
      localStorage.removeItem(DOCUMENT_KEY);
      localStorage.removeItem(CHAT_KEY);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  },

  clearApiKey(): void {
    try {
      localStorage.removeItem(API_KEY);
    } catch (error) {
      console.error('Failed to clear API key:', error);
    }
  },
};
