import jsPDF from 'jspdf';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import type { ExportFormat } from '../types';

export async function exportDocument(
  content: string,
  filename: string,
  format: ExportFormat
): Promise<void> {
  switch (format) {
    case 'pdf':
      return exportToPDF(content, filename);
    case 'docx':
      return exportToDOCX(content, filename);
    case 'markdown':
      return exportToMarkdown(content, filename);
    case 'html':
      return exportToHTML(content, filename);
    case 'txt':
      return exportToText(content, filename);
  }
}

function exportToPDF(content: string, filename: string): void {
  const doc = new jsPDF();
  const strippedContent = stripHtml(content);
  const lines = doc.splitTextToSize(strippedContent, 180);
  doc.text(lines, 15, 15);
  doc.save(`${filename}.pdf`);
}

async function exportToDOCX(content: string, filename: string): Promise<void> {
  const strippedContent = stripHtml(content);
  const paragraphs = strippedContent.split('\n\n').map(
    (para) =>
      new Paragraph({
        children: [new TextRun(para)],
      })
  );

  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${filename}.docx`);
}

function exportToMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  downloadBlob(blob, `${filename}.md`);
}

function exportToHTML(content: string, filename: string): void {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
  </style>
</head>
<body>
  ${content}
</body>
</html>
  `.trim();

  const blob = new Blob([html], { type: 'text/html' });
  downloadBlob(blob, `${filename}.html`);
}

function exportToText(content: string, filename: string): void {
  const strippedContent = stripHtml(content);
  const blob = new Blob([strippedContent], { type: 'text/plain' });
  downloadBlob(blob, `${filename}.txt`);
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
