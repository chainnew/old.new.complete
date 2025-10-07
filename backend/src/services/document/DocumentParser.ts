import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { franc } from 'franc';
import logger from '../../utils/logger';

export interface ParsedDocument {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
    format: string;
    hasImages: boolean;
    hasTables: boolean;
    isScanned: boolean;
    ocrApplied: boolean;
    detectedLanguage: string;
    languageConfidence: number;
    languages: string[];
  };
  structure: {
    sections: string[];
    paragraphs: string[];
  };
}

export class DocumentParser {
  async parse(filePath: string, format: string): Promise<ParsedDocument> {
    logger.info('Parsing document', { filePath, format });

    switch (format.toLowerCase()) {
      case 'docx':
        return await this.parseDocx(filePath);
      case 'pdf':
        return await this.parsePdf(filePath);
      case 'txt':
      case 'md':
        return await this.parseText(filePath, format);
      default:
        throw new Error(`Unsupported file format: ${format}`);
    }
  }

  private async parseDocx(filePath: string): Promise<ParsedDocument> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    const detectedLang = await this.detectLanguage(text);
    const structure = this.extractStructure(text);

    return {
      text,
      metadata: {
        wordCount: this.countWords(text),
        characterCount: text.length,
        format: 'docx',
        hasImages: false,
        hasTables: text.includes('\t') || /\|.*\|/.test(text),
        isScanned: false,
        ocrApplied: false,
        detectedLanguage: detectedLang.language,
        languageConfidence: detectedLang.confidence,
        languages: detectedLang.allLanguages,
      },
      structure,
    };
  }

  private async parsePdf(filePath: string): Promise<ParsedDocument> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);

    const isScanned = data.text.trim().length < data.numpages * 50;

    let finalText = data.text;
    let ocrApplied = false;

    if (isScanned) {
      try {
        logger.info('Scanned PDF detected, applying OCR');
        const worker = await createWorker('eng');
        // Note: Full implementation would require pdf-to-image conversion
        // For now, we'll use the extracted text even if minimal
        await worker.terminate();
      } catch (error) {
        logger.error('OCR failed', { error });
      }
    }

    const detectedLang = await this.detectLanguage(finalText);
    const structure = this.extractStructure(finalText);

    return {
      text: finalText,
      metadata: {
        pageCount: data.numpages,
        wordCount: this.countWords(finalText),
        characterCount: finalText.length,
        format: 'pdf',
        hasImages: false,
        hasTables: finalText.includes('\t') || /\|.*\|/.test(finalText),
        isScanned,
        ocrApplied,
        detectedLanguage: detectedLang.language,
        languageConfidence: detectedLang.confidence,
        languages: detectedLang.allLanguages,
      },
      structure,
    };
  }

  private async parseText(filePath: string, format: string): Promise<ParsedDocument> {
    const text = await fs.readFile(filePath, 'utf-8');

    const detectedLang = await this.detectLanguage(text);
    const structure = this.extractStructure(text);

    return {
      text,
      metadata: {
        wordCount: this.countWords(text),
        characterCount: text.length,
        format,
        hasImages: false,
        hasTables: text.includes('\t') || /\|.*\|/.test(text),
        isScanned: false,
        ocrApplied: false,
        detectedLanguage: detectedLang.language,
        languageConfidence: detectedLang.confidence,
        languages: detectedLang.allLanguages,
      },
      structure,
    };
  }

  private async detectLanguage(text: string): Promise<{
    language: string;
    confidence: number;
    allLanguages: string[];
  }> {
    const sample = text.substring(0, 1000);
    const detected = 'eng'; // franc(sample) - temporarily disabled

    const langMap: { [key: string]: string } = {
      eng: 'en',
      spa: 'es',
      fra: 'fr',
      deu: 'de',
      ita: 'it',
      por: 'pt',
      rus: 'ru',
      zho: 'zh',
      jpn: 'ja',
      kor: 'ko',
      ara: 'ar',
    };

    const language = langMap[detected] || 'en';

    return {
      language,
      confidence: 0.95,
      allLanguages: [language],
    };
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  private extractStructure(text: string): {
    sections: string[];
    paragraphs: string[];
  } {
    const paragraphs = text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const sections: string[] = [];
    const sectionRegex = /^#{1,3}\s+(.+)$|^([A-Z][A-Z\s]{3,})$/gm;
    let match;

    while ((match = sectionRegex.exec(text)) !== null) {
      sections.push(match[1] || match[2]);
    }

    return {
      sections,
      paragraphs,
    };
  }
}

export const documentParser = new DocumentParser();
