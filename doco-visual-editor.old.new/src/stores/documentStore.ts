import { create } from 'zustand';
import type { Document, SaveStatus, EditorTab } from '../types';
import { storage } from '../lib/storage';
import { generateId } from '../lib/utils';

interface DocumentStore {
  document: Document;
  saveStatus: SaveStatus;
  activeTab: EditorTab;
  selectedText: string;

  setContent: (content: string) => void;
  setMarkdown: (markdown: string) => void;
  setTitle: (title: string) => void;
  setActiveTab: (tab: EditorTab) => void;
  setSelectedText: (text: string) => void;
  saveDocument: () => void;
  loadDocument: () => void;
  createNewDocument: () => void;
  setSaveStatus: (status: SaveStatus) => void;
}

const createEmptyDocument = (): Document => ({
  id: generateId(),
  title: 'Untitled Document',
  content: '',
  markdown: '',
  lastSaved: Date.now(),
  created: Date.now(),
});

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  document: createEmptyDocument(),
  saveStatus: 'saved',
  activeTab: 'document',
  selectedText: '',

  setContent: (content) => {
    set((state) => ({
      document: { ...state.document, content },
      saveStatus: 'unsaved',
    }));
  },

  setMarkdown: (markdown) => {
    set((state) => ({
      document: { ...state.document, markdown },
      saveStatus: 'unsaved',
    }));
  },

  setTitle: (title) => {
    set((state) => ({
      document: { ...state.document, title },
      saveStatus: 'unsaved',
    }));
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  setSelectedText: (text) => {
    set({ selectedText: text });
  },

  saveDocument: () => {
    const { document } = get();
    const updatedDoc = { ...document, lastSaved: Date.now() };
    storage.saveDocument(updatedDoc);
    set({ document: updatedDoc, saveStatus: 'saved' });
  },

  loadDocument: () => {
    const doc = storage.loadDocument();
    if (doc) {
      set({ document: doc, saveStatus: 'saved' });
    }
  },

  createNewDocument: () => {
    set({ document: createEmptyDocument(), saveStatus: 'saved' });
  },

  setSaveStatus: (status) => {
    set({ saveStatus: status });
  },
}));
