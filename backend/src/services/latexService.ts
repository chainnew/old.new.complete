import { promises as fs } from 'fs';
import path from 'path';

interface ResumeData {
  name: string;
  title?: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  website?: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location: string;
    year: string;
  }>;
  skills: string[];
  certifications?: string[];
}

const TEMPLATE_DIR = path.join(__dirname, '../../../templates');

const TEMPLATE_MAP: Record<string, string> = {
  'blue-horizon': 'blue-horizon-v2.tex',
  'sleek-monochrome': 'sleek-monochrome-v2.tex',
  'modern-sidebar': 'modern-sidebar-v2.tex',
};

export class LatexService {
  /**
   * Generate LaTeX code from resume data using a specific template
   */
  async generateResume(data: ResumeData, styleId: string): Promise<string> {
    const templateFile = TEMPLATE_MAP[styleId] || TEMPLATE_MAP['blue-horizon'];
    const templatePath = path.join(TEMPLATE_DIR, templateFile);

    try {
      let template = await fs.readFile(templatePath, 'utf-8');

      // Replace placeholders
      template = template.replace(/\{\{NAME\}\}/g, this.escape(data.name));
      template = template.replace(/\{\{TITLE\}\}/g, this.escape(data.title || ''));
      template = template.replace(/\{\{EMAIL\}\}/g, this.escape(data.email));
      template = template.replace(/\{\{PHONE\}\}/g, this.escape(data.phone));
      template = template.replace(/\{\{SUMMARY\}\}/g, this.escape(data.summary));

      // Conditional sections
      const locationSection = data.location
        ? ` \\quad | \\quad ${this.escape(data.location)}`
        : '';
      template = template.replace(/\{\{LOCATION_SECTION\}\}/g, locationSection);

      const linkedinSection = data.linkedin
        ? ` \\quad | \\quad \\href{${this.escape(data.linkedin)}}{LinkedIn}`
        : '';
      template = template.replace(/\{\{LINKEDIN_SECTION\}\}/g, linkedinSection);

      // Format experience section
      const experienceLatex = data.experience
        .map((exp) => {
          const bullets = exp.bullets.map((b) => `  \\item ${this.escape(b)}`).join('\n');
          return `
\\subsection*{${this.escape(exp.title)} \\hfill \\textcolor{sectiongray}{${this.escape(exp.startDate)} -- ${this.escape(exp.endDate)}}}
\\textit{\\textcolor{sectiongray}{${this.escape(exp.company)}, ${this.escape(exp.location)}}}
\\begin{itemize}
${bullets}
\\end{itemize}
`;
        })
        .join('\n');
      template = template.replace(/\{\{EXPERIENCE\}\}/g, experienceLatex);

      // Format education section
      const educationLatex = data.education
        .map((edu) => {
          return `\\textbf{${this.escape(edu.degree)}} \\hfill \\textcolor{sectiongray}{${this.escape(edu.year)}}\\\\
\\textbf{${this.escape(edu.institution)}} -- ${this.escape(edu.location)}`;
        })
        .join('\n\n');
      template = template.replace(/\{\{EDUCATION\}\}/g, educationLatex);

      // Format skills section
      const skillsLatex = data.skills
        .map((skill) => this.escape(skill))
        .join(' \\textbullet\\ ');
      template = template.replace(/\{\{SKILLS\}\}/g, skillsLatex);

      // Format certifications section
      const certificationsSection = data.certifications && data.certifications.length > 0
        ? `\n\\section*{CERTIFICATIONS}
\\textcolor{textgray}{${data.certifications.map(c => this.escape(c)).join(' \\textbullet\\ ')}}`
        : '';
      template = template.replace(/\{\{CERTIFICATIONS_SECTION\}\}/g, certificationsSection);

      return template;
    } catch (error) {
      console.error('Error generating LaTeX:', error);
      throw new Error('Failed to generate LaTeX resume');
    }
  }

  /**
   * Escape special LaTeX characters
   */
  private escape(text: string): string {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  }

  /**
   * Get available template styles
   */
  getAvailableStyles(): string[] {
    return Object.keys(TEMPLATE_MAP);
  }
}

export const latexService = new LatexService();
