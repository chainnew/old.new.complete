import fs from 'fs/promises';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import logger from '../../utils/logger';

export class DocumentFormatter {
  /**
   * Generate a formatted DOCX file from enhanced text
   */
  async generateDocx(
    text: string,
    options: {
      title?: string;
      author?: string;
      documentType?: string;
    } = {}
  ): Promise<Buffer> {
    logger.info('Generating DOCX', { textLength: text.length });

    const paragraphs: Paragraph[] = [];

    // Add title if provided
    if (options.title) {
      paragraphs.push(
        new Paragraph({
          text: options.title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        })
      );
    }

    // Split text into paragraphs and create DOCX structure
    const textParagraphs = text.split(/\n\n+/);

    textParagraphs.forEach((para) => {
      if (para.trim().length === 0) return;

      // Check if it's a heading (starts with # or all caps short line)
      if (para.startsWith('#')) {
        const headingText = para.replace(/^#+\s*/, '').trim();
        const level = para.match(/^#+/)?.[0].length || 1;
        paragraphs.push(
          new Paragraph({
            text: headingText,
            heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
          })
        );
      } else if (para.length < 60 && para === para.toUpperCase()) {
        paragraphs.push(
          new Paragraph({
            text: para,
            heading: HeadingLevel.HEADING_2,
          })
        );
      } else {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(para)],
            spacing: { after: 200 },
          })
        );
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    logger.info('DOCX generated successfully');
    return buffer;
  }

  /**
   * Generate LaTeX formatted document
   */
  async generateLatex(
    text: string,
    options: {
      title?: string;
      author?: string;
      documentType?: string;
      documentClass?: string;
    } = {}
  ): Promise<string> {
    logger.info('Generating LaTeX', { textLength: text.length });

    const documentClass = options.documentClass || this.getLatexDocumentClass(options.documentType);

    let latex = `\\documentclass[12pt]{${documentClass}}\n`;
    latex += `\\usepackage[utf8]{inputenc}\n`;
    latex += `\\usepackage{graphicx}\n`;
    latex += `\\usepackage{hyperref}\n`;
    latex += `\\usepackage{setspace}\n`;
    latex += `\\usepackage{geometry}\n`;
    latex += `\\geometry{a4paper, margin=1in}\n\n`;

    if (options.title) {
      latex += `\\title{${this.escapeLatex(options.title)}}\n`;
    }

    if (options.author) {
      latex += `\\author{${this.escapeLatex(options.author)}}\n`;
    }

    latex += `\\date{\\today}\n\n`;
    latex += `\\begin{document}\n\n`;

    if (options.title) {
      latex += `\\maketitle\n\n`;
    }

    // Process text into LaTeX format
    const paragraphs = text.split(/\n\n+/);

    paragraphs.forEach((para) => {
      if (para.trim().length === 0) return;

      // Handle headings
      if (para.startsWith('# ')) {
        const heading = para.replace(/^#\s*/, '').trim();
        latex += `\\section{${this.escapeLatex(heading)}}\n\n`;
      } else if (para.startsWith('## ')) {
        const heading = para.replace(/^##\s*/, '').trim();
        latex += `\\subsection{${this.escapeLatex(heading)}}\n\n`;
      } else if (para.startsWith('### ')) {
        const heading = para.replace(/^###\s*/, '').trim();
        latex += `\\subsubsection{${this.escapeLatex(heading)}}\n\n`;
      } else if (para.length < 60 && para === para.toUpperCase()) {
        latex += `\\section{${this.escapeLatex(para)}}\n\n`;
      } else {
        // Regular paragraph
        latex += `${this.escapeLatex(para)}\n\n`;
      }
    });

    latex += `\\end{document}\n`;

    logger.info('LaTeX generated successfully');
    return latex;
  }

  /**
   * Save document to file system
   */
  async saveDocument(
    content: Buffer | string,
    filename: string,
    outputDir: string
  ): Promise<string> {
    await fs.mkdir(outputDir, { recursive: true });
    const filePath = path.join(outputDir, filename);
    await fs.writeFile(filePath, content);
    logger.info('Document saved', { filePath });
    return filePath;
  }

  private getLatexDocumentClass(documentType?: string): string {
    switch (documentType) {
      case 'resume':
      case 'cover_letter':
        return 'article';
      case 'research_paper':
      case 'thesis':
        return 'article';
      case 'business_proposal':
      case 'business_plan':
        return 'report';
      case 'book':
        return 'book';
      default:
        return 'article';
    }
  }

  private escapeLatex(text: string): string {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}')
      .replace(/"/g, "''")
      .replace(/</g, '\\textless{}')
      .replace(/>/g, '\\textgreater{}');
  }

  /**
   * Generate HTML output (for preview)
   */
  async generateHtml(
    text: string,
    options: {
      title?: string;
      includeStyles?: boolean;
    } = {}
  ): Promise<string> {
    const paragraphs = text.split(/\n\n+/);
    let html = '';

    if (options.includeStyles) {
      html += `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${options.title || 'Document'}</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1, h2, h3 { margin-top: 2rem; }
    p { margin-bottom: 1rem; }
  </style>
</head>
<body>`;
    }

    if (options.title) {
      html += `<h1>${this.escapeHtml(options.title)}</h1>\n`;
    }

    paragraphs.forEach((para) => {
      if (para.trim().length === 0) return;

      if (para.startsWith('# ')) {
        const heading = para.replace(/^#\s*/, '').trim();
        html += `<h1>${this.escapeHtml(heading)}</h1>\n`;
      } else if (para.startsWith('## ')) {
        const heading = para.replace(/^##\s*/, '').trim();
        html += `<h2>${this.escapeHtml(heading)}</h2>\n`;
      } else if (para.startsWith('### ')) {
        const heading = para.replace(/^###\s*/, '').trim();
        html += `<h3>${this.escapeHtml(heading)}</h3>\n`;
      } else {
        html += `<p>${this.escapeHtml(para)}</p>\n`;
      }
    });

    if (options.includeStyles) {
      html += `</body>\n</html>`;
    }

    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export const documentFormatter = new DocumentFormatter();
