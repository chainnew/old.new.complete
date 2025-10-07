/**
 * Visual Document Generator
 * Hybrid rendering engine supporting:
 * 1. HTML/CSS templates for structured documents (resumes, reports, letters)
 * 2. SVG for flowcharts and diagrams (Mermaid.js, D3.js)
 * 3. Canvas for complex infographics
 */

export type DocumentType = 'resume' | 'flowchart' | 'infographic' | 'report' | 'letter';
export type TemplateStyle = 'modern-blue' | 'minimal-gray' | 'creative-teal';

export interface VisualDocument {
  type: DocumentType;
  style: TemplateStyle;
  data: any;
  html?: string;
  svg?: string;
  metadata: {
    title: string;
    author?: string;
    created: string;
  };
}

export class VisualGenerator {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Main method: Analyze text and generate appropriate visual document
   */
  async generateFromText(text: string, style: TemplateStyle): Promise<VisualDocument> {
    // Use AI to analyze content and determine document type
    const analysis = await this.analyzeContent(text);

    switch (analysis.type) {
      case 'resume':
        return this.generateResume(analysis.structuredData, style);
      case 'flowchart':
        return this.generateFlowchart(analysis.structuredData, style);
      case 'infographic':
        return this.generateInfographic(analysis.structuredData, style);
      case 'report':
        return this.generateReport(analysis.structuredData, style);
      case 'letter':
        return this.generateLetter(analysis.structuredData, style);
      default:
        return this.generateResume(analysis.structuredData, style);
    }
  }

  /**
   * AI-powered content analysis
   * Extracts structured data from raw text
   */
  private async analyzeContent(text: string): Promise<{
    type: DocumentType;
    structuredData: any;
  }> {
    const prompt = `Analyze this document and extract structured data:

${text}

Return JSON with:
1. "type": document type (resume, flowchart, infographic, report, letter)
2. "structuredData": extracted information in appropriate format

For resumes: name, email, phone, summary, experience[], education[], skills[]
For flowcharts: nodes[], edges[], title
For infographics: sections[], dataPoints[], visualType
For reports: title, sections[], findings[]
For letters: recipient, sender, date, body

Return ONLY valid JSON, no markdown.`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: assume it's a resume
    return {
      type: 'resume',
      structuredData: { rawText: text }
    };
  }

  /**
   * Generate HTML/CSS resume
   */
  private async generateResume(data: any, style: TemplateStyle): Promise<VisualDocument> {
    const html = this.renderResumeHTML(data, style);

    return {
      type: 'resume',
      style,
      data,
      html,
      metadata: {
        title: data.name || 'Resume',
        author: data.name,
        created: new Date().toISOString(),
      }
    };
  }

  /**
   * Generate SVG flowchart using Mermaid.js syntax
   */
  private async generateFlowchart(data: any, style: TemplateStyle): Promise<VisualDocument> {
    const mermaidCode = this.generateMermaidFlowchart(data);

    return {
      type: 'flowchart',
      style,
      data,
      svg: mermaidCode,
      metadata: {
        title: data.title || 'Flowchart',
        created: new Date().toISOString(),
      }
    };
  }

  /**
   * Generate infographic with SVG + data binding
   */
  private async generateInfographic(data: any, style: TemplateStyle): Promise<VisualDocument> {
    const svg = this.renderInfographicSVG(data, style);

    return {
      type: 'infographic',
      style,
      data,
      svg,
      metadata: {
        title: data.title || 'Infographic',
        created: new Date().toISOString(),
      }
    };
  }

  /**
   * Generate HTML/CSS report
   */
  private async generateReport(data: any, style: TemplateStyle): Promise<VisualDocument> {
    const html = this.renderReportHTML(data, style);

    return {
      type: 'report',
      style,
      data,
      html,
      metadata: {
        title: data.title || 'Report',
        created: new Date().toISOString(),
      }
    };
  }

  /**
   * Generate HTML/CSS letter
   */
  private async generateLetter(data: any, style: TemplateStyle): Promise<VisualDocument> {
    const html = this.renderLetterHTML(data, style);

    return {
      type: 'letter',
      style,
      data,
      html,
      metadata: {
        title: 'Letter',
        created: new Date().toISOString(),
      }
    };
  }

  /**
   * Render resume using HTML/CSS Grid/Flexbox
   */
  private renderResumeHTML(data: any, style: TemplateStyle): string {
    const colors = this.getStyleColors(style);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
    }

    .resume-container {
      max-width: 850px;
      margin: 0 auto;
      padding: 3rem 2.5rem;
      background: white;
    }

    /* Header Section */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 2rem;
      border-bottom: 3px solid ${colors.primary};
      margin-bottom: 2rem;
    }

    .header-left h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: ${colors.primary};
      margin-bottom: 0.5rem;
      letter-spacing: -0.5px;
    }

    .header-left .title {
      font-size: 1.25rem;
      color: #6b7280;
      font-weight: 500;
    }

    .header-right {
      text-align: right;
      font-size: 0.95rem;
      color: #4b5563;
    }

    .header-right a {
      color: ${colors.primary};
      text-decoration: none;
    }

    /* Grid Layout for Main Content */
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2.5rem;
    }

    /* Section Styling */
    .section {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: ${colors.primary};
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid ${colors.accent};
      padding-bottom: 0.5rem;
    }

    /* Experience Items */
    .experience-item {
      margin-bottom: 1.5rem;
    }

    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.5rem;
    }

    .job-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #111827;
    }

    .company {
      font-size: 1rem;
      color: ${colors.primary};
      font-weight: 600;
    }

    .date {
      font-size: 0.9rem;
      color: #6b7280;
      font-style: italic;
    }

    .description {
      margin-top: 0.5rem;
      color: #374151;
    }

    .description ul {
      margin-left: 1.25rem;
      margin-top: 0.5rem;
    }

    .description li {
      margin-bottom: 0.4rem;
    }

    /* Skills Section */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .skill-category {
      margin-bottom: 1rem;
    }

    .skill-category h4 {
      font-size: 1rem;
      font-weight: 700;
      color: ${colors.primary};
      margin-bottom: 0.5rem;
    }

    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .skill-tag {
      background: ${colors.background};
      color: ${colors.primary};
      padding: 0.35rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid ${colors.accent};
    }

    /* Education */
    .education-item {
      margin-bottom: 1rem;
    }

    .degree {
      font-weight: 700;
      color: #111827;
      font-size: 1.05rem;
    }

    .school {
      color: ${colors.primary};
      font-weight: 600;
    }

    /* Sidebar */
    .sidebar .section {
      background: ${colors.background};
      padding: 1.5rem;
      border-radius: 0.5rem;
      border-left: 4px solid ${colors.primary};
    }

    @media print {
      body { background: white; }
      .resume-container { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <div class="header">
      <div class="header-left">
        <h1>${data.name || 'Your Name'}</h1>
        <div class="title">${data.title || 'Professional Title'}</div>
      </div>
      <div class="header-right">
        <div>${data.email || 'email@example.com'}</div>
        <div>${data.phone || '(123) 456-7890'}</div>
        <div>${data.location || 'City, State'}</div>
        ${data.linkedin ? `<div><a href="${data.linkedin}">LinkedIn</a></div>` : ''}
      </div>
    </div>

    ${data.summary ? `
    <div class="section">
      <h2 class="section-title">Professional Summary</h2>
      <p>${data.summary}</p>
    </div>
    ` : ''}

    <div class="content-grid">
      <div class="main-content">
        ${this.renderExperienceSection(data.experience || [])}
        ${this.renderEducationSection(data.education || [])}
      </div>

      <div class="sidebar">
        ${this.renderSkillsSection(data.skills || [])}
        ${data.certifications ? this.renderCertificationsSection(data.certifications) : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  private renderExperienceSection(experience: any[]): string {
    if (!experience || experience.length === 0) return '';

    return `
    <div class="section">
      <h2 class="section-title">Experience</h2>
      ${experience.map(job => `
        <div class="experience-item">
          <div class="experience-header">
            <div>
              <div class="job-title">${job.title || job.position || ''}</div>
              <div class="company">${job.company || ''}</div>
            </div>
            <div class="date">${job.date || job.duration || ''}</div>
          </div>
          <div class="description">
            ${job.description ? `<p>${job.description}</p>` : ''}
            ${job.responsibilities ? `
              <ul>
                ${job.responsibilities.map((item: string) => `<li>${item}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  private renderEducationSection(education: any[]): string {
    if (!education || education.length === 0) return '';

    return `
    <div class="section">
      <h2 class="section-title">Education</h2>
      ${education.map(edu => `
        <div class="education-item">
          <div class="degree">${edu.degree || ''}</div>
          <div class="school">${edu.school || edu.institution || ''}</div>
          <div class="date">${edu.date || edu.year || ''}</div>
          ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
        </div>
      `).join('')}
    </div>`;
  }

  private renderSkillsSection(skills: any): string {
    if (!skills) return '';

    // Handle both object format (categorized) and array format
    if (Array.isArray(skills)) {
      return `
      <div class="section">
        <h2 class="section-title">Skills</h2>
        <div class="skill-tags">
          ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </div>`;
    } else {
      return `
      <div class="section">
        <h2 class="section-title">Skills</h2>
        <div class="skills-grid">
          ${Object.entries(skills).map(([category, items]) => `
            <div class="skill-category">
              <h4>${category}</h4>
              <div class="skill-tags">
                ${Array.isArray(items) ? items.map((item: string) => `<span class="skill-tag">${item}</span>`).join('') : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
    }
  }

  private renderCertificationsSection(certifications: any[]): string {
    return `
    <div class="section">
      <h2 class="section-title">Certifications</h2>
      <ul>
        ${certifications.map(cert => `<li>${cert.name || cert} ${cert.year ? `(${cert.year})` : ''}</li>`).join('')}
      </ul>
    </div>`;
  }

  private getStyleColors(style: TemplateStyle): { primary: string; accent: string; background: string } {
    const styles = {
      'modern-blue': {
        primary: '#2563eb',
        accent: '#93c5fd',
        background: '#eff6ff'
      },
      'minimal-gray': {
        primary: '#1f2937',
        accent: '#9ca3af',
        background: '#f9fafb'
      },
      'creative-teal': {
        primary: '#0d9488',
        accent: '#5eead4',
        background: '#f0fdfa'
      }
    };

    return styles[style] || styles['modern-blue'];
  }

  /**
   * Generate Mermaid.js flowchart code
   */
  private generateMermaidFlowchart(data: any): string {
    return `graph TD
    ${data.nodes?.map((node: any, i: number) =>
      `${node.id || `node${i}`}[${node.label || node.text}]`
    ).join('\n    ') || ''}

    ${data.edges?.map((edge: any) =>
      `${edge.from} --> ${edge.to}`
    ).join('\n    ') || ''}`;
  }

  /**
   * Generate SVG infographic
   */
  private renderInfographicSVG(data: any, style: TemplateStyle): string {
    const colors = this.getStyleColors(style);

    return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="600" fill="white"/>
      <text x="400" y="50" text-anchor="middle" font-size="32" font-weight="bold" fill="${colors.primary}">
        ${data.title || 'Infographic'}
      </text>
      <!-- Add more SVG elements based on data -->
    </svg>`;
  }

  /**
   * Generate HTML report
   */
  private renderReportHTML(data: any, style: TemplateStyle): string {
    const colors = this.getStyleColors(style);

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; max-width: 850px; margin: 0 auto; padding: 2rem; }
    h1 { color: ${colors.primary}; }
    .section { margin: 2rem 0; }
  </style>
</head>
<body>
  <h1>${data.title || 'Report'}</h1>
  ${data.sections?.map((section: any) => `
    <div class="section">
      <h2>${section.title}</h2>
      <p>${section.content}</p>
    </div>
  `).join('') || ''}
</body>
</html>`;
  }

  /**
   * Generate HTML letter
   */
  private renderLetterHTML(data: any, style: TemplateStyle): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; max-width: 650px; margin: 0 auto; padding: 3rem; }
    .letter-header { margin-bottom: 2rem; }
    .letter-body { line-height: 1.8; }
  </style>
</head>
<body>
  <div class="letter-header">
    <div>${data.sender || ''}</div>
    <div>${data.date || new Date().toLocaleDateString()}</div>
  </div>
  <div>${data.recipient || ''}</div>
  <div class="letter-body">
    ${data.body || ''}
  </div>
  <div>Sincerely,<br/>${data.sender || ''}</div>
</body>
</html>`;
  }
}
