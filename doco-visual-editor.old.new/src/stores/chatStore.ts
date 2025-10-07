import { create } from 'zustand';
import type { Message, DocoState } from '../types';
import { storage } from '../lib/storage';
import { generateId } from '../lib/utils';

interface ChatStore {
  messages: Message[];
  docoState: DocoState;
  streamingMessage: string;

  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setDocoState: (state: DocoState) => void;
  setStreamingMessage: (message: string) => void;
  clearStreamingMessage: () => void;
  loadChatHistory: () => void;
  clearChatHistory: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  docoState: 'idle',
  streamingMessage: '',

  addMessage: (role, content) => {
    const message: Message = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now(),
    };

    set((state) => {
      const newMessages = [...state.messages, message];
      storage.saveChatHistory(newMessages);
      return { messages: newMessages };
    });
  },

  setDocoState: (state) => {
    set({ docoState: state });
  },

  setStreamingMessage: (message) => {
    set({ streamingMessage: message });
  },

  clearStreamingMessage: () => {
    set({ streamingMessage: '' });
  },

  loadChatHistory: () => {
    const messages = storage.loadChatHistory();
    set({ messages });
  },

  clearChatHistory: () => {
    set({ messages: [] });
    storage.saveChatHistory([]);
  },

  clearMessages: () => {
    set({ messages: [] });
    storage.saveChatHistory([]);
  },
}));
