import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type ExportFormat = 'pdf' | 'png' | 'svg' | 'html';

export class VisualExporter {
  /**
   * Export HTML content to various formats
   */
  async exportDocument(
    content: string,
    format: ExportFormat,
    filename: string = 'document'
  ): Promise<void> {
    switch (format) {
      case 'pdf':
        return this.exportToPDF(content, filename);
      case 'png':
        return this.exportToPNG(content, filename);
      case 'svg':
        return this.exportToSVG(content, filename);
      case 'html':
        return this.exportToHTML(content, filename);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to PDF using html2canvas + jsPDF
   */
  private async exportToPDF(htmlContent: string, filename: string): Promise<void> {
    // Create temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '850px'; // A4 width at 96 DPI
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      // Render HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Download
      pdf.save(`${filename}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * Export to PNG using html2canvas
   */
  private async exportToPNG(htmlContent: string, filename: string): Promise<void> {
    // Create temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '850px';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * Export to SVG (if content contains SVG)
   */
  private async exportToSVG(content: string, filename: string): Promise<void> {
    // Extract SVG from content
    const svgMatch = content.match(/<svg[\s\S]*<\/svg>/i);
    if (!svgMatch) {
      throw new Error('No SVG content found in document');
    }

    const svgContent = svgMatch[0];
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.svg`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Export to HTML file
   */
  private async exportToHTML(content: string, filename: string): Promise<void> {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.html`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Export Mermaid diagram to PNG
   */
  async exportMermaidToPNG(svgElement: SVGElement, filename: string): Promise<void> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.png`;
            a.click();
            URL.revokeObjectURL(url);
            resolve();
          } else {
            reject(new Error('Failed to create blob'));
          }
        });
      };

      img.onerror = () => reject(new Error('Failed to load SVG'));
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    });
  }

  /**
   * Export Mermaid diagram to PDF
   */
  async exportMermaidToPDF(svgElement: SVGElement, filename: string): Promise<void> {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: img.width > img.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [img.width, img.height],
        });

        pdf.addImage(imgData, 'PNG', 0, 0, img.width, img.height);
        pdf.save(`${filename}.pdf`);
        resolve();
      };

      img.onerror = () => reject(new Error('Failed to load SVG'));
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    });
  }
}

export const visualExporter = new VisualExporter();
