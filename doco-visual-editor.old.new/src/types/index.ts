export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  markdown: string;
  lastSaved: number;
  created: number;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'html' | 'txt';

export type EditorTab = 'document' | 'code';

export type DocoState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';
