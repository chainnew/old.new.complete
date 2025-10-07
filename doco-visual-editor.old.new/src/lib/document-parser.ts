import mammoth from 'mammoth';
import { marked } from 'marked';

export async function parseFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'docx':
      return parseDocx(file);
    case 'md':
    case 'markdown':
      return parseMarkdown(file);
    case 'txt':
    case 'html':
      return parseText(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function parseMarkdown(file: File): Promise<string> {
  const text = await file.text();
  return text;
}

async function parseText(file: File): Promise<string> {
  return file.text();
}
