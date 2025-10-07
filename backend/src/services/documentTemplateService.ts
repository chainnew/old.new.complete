import { promises as fs } from 'fs';
import path from 'path';

interface TechReportSection {
  number: number;
  title: string;
  description: string;
  command?: string;
  output?: string;
  analysis?: string;
}

interface TechnicalReportData {
  title: string;
  author: string;
  system: string;
  status: string;
  executiveSummary: string;
  keyFindings: string[];
  concludingRemarks: string;
  sections: TechReportSection[];
}

interface LetterData {
  senderName: string;
  senderAddress?: string;
  senderPhone?: string;
  senderEmail: string;
  date?: string;
  recipientName: string;
  recipientTitle?: string;
  recipientCompany?: string;
  recipientAddress?: string;
  subjectLine?: string;
  salutation?: string;
  bodyContent: string;
  closing?: string;
  signatureBlock?: string;
}

interface ProposalData {
  projectTitle: string;
  projectSubtitle?: string;
  authorName: string;
  organization: string;
  date?: string;
  executiveSummary: string;
  projectOverview: string;
  objectives: string;
  scope: string;
  inScope?: string;
  outOfScope?: string;
  methodology: string;
  timeline: string;
  budget: string;
  teamResources: string;
  riskAssessment: string;
  successCriteria: string;
  conclusion: string;
}

const TEMPLATE_DIR = path.join(__dirname, '../../../templates');

export class DocumentTemplateService {
  /**
   * Generate technical evidence report
   */
  async generateTechnicalReport(data: TechnicalReportData): Promise<string> {
    const templatePath = path.join(TEMPLATE_DIR, 'technical-evidence-report.tex');

    try {
      let template = await fs.readFile(templatePath, 'utf-8');

      // Replace basic placeholders
      template = template.replace(/\{\{TITLE\}\}/g, this.escape(data.title));
      template = template.replace(/\{\{AUTHOR\}\}/g, this.escape(data.author));
      template = template.replace(/\{\{SYSTEM\}\}/g, this.escape(data.system));
      template = template.replace(/\{\{STATUS\}\}/g, this.escape(data.status));
      template = template.replace(/\{\{EXECUTIVE_SUMMARY\}\}/g, this.escape(data.executiveSummary));
      template = template.replace(/\{\{CONCLUDING_REMARKS\}\}/g, this.escape(data.concludingRemarks));

      // Format key findings
      const keyFindingsLatex = data.keyFindings && data.keyFindings.length > 0
        ? `\\begin{itemize}\n${data.keyFindings.map(f => `    \\item ${this.escape(f)}`).join('\n')}\n\\end{itemize}`
        : '';
      template = template.replace(/\{\{KEY_FINDINGS\}\}/g, keyFindingsLatex);

      // Format content sections
      const sectionsLatex = data.sections.map(section => {
        let sectionText = `\\section*{${section.number}. TTP \\#${section.number}: ${this.escape(section.title)}}\n\n`;
        sectionText += `${this.escape(section.description)}\n\n`;

        if (section.command) {
          sectionText += `\\subsection*{Command}\n\\begin{lstlisting}[language=bash]\n${section.command}\n\\end{lstlisting}\n\n`;
        }

        if (section.output) {
          sectionText += `\\subsection*{Output}\n\\begin{lstlisting}\n${section.output}\n\\end{lstlisting}\n\n`;
        }

        if (section.analysis) {
          sectionText += `\\subsection*{Analysis}\n${this.escape(section.analysis)}\n\n`;
        }

        return sectionText;
      }).join('\n');

      template = template.replace(/\{\{CONTENT_SECTIONS\}\}/g, sectionsLatex);

      return template;
    } catch (error) {
      console.error('Error generating technical report:', error);
      throw new Error('Failed to generate technical report');
    }
  }

  /**
   * Generate professional letter
   */
  async generateLetter(data: LetterData): Promise<string> {
    const templatePath = path.join(TEMPLATE_DIR, 'professional-letter.tex');

    try {
      let template = await fs.readFile(templatePath, 'utf-8');

      template = template.replace(/\{\{SENDER_NAME\}\}/g, this.escape(data.senderName));
      template = template.replace(/\{\{SENDER_ADDRESS\}\}/g, this.escape(data.senderAddress || ''));
      template = template.replace(/\{\{SENDER_PHONE\}\}/g, this.escape(data.senderPhone || ''));
      template = template.replace(/\{\{SENDER_EMAIL\}\}/g, this.escape(data.senderEmail));
      template = template.replace(/\{\{DATE\}\}/g, data.date || '\\today');
      template = template.replace(/\{\{RECIPIENT_NAME\}\}/g, this.escape(data.recipientName));
      template = template.replace(/\{\{RECIPIENT_TITLE\}\}/g, this.escape(data.recipientTitle || ''));
      template = template.replace(/\{\{RECIPIENT_COMPANY\}\}/g, this.escape(data.recipientCompany || ''));
      template = template.replace(/\{\{RECIPIENT_ADDRESS\}\}/g, this.escape(data.recipientAddress || ''));

      const subjectLine = data.subjectLine
        ? `\\textbf{Re: ${this.escape(data.subjectLine)}}`
        : '';
      template = template.replace(/\{\{SUBJECT_LINE\}\}/g, subjectLine);

      template = template.replace(/\{\{SALUTATION\}\}/g, this.escape(data.salutation || 'Dear Hiring Manager,'));
      template = template.replace(/\{\{BODY_CONTENT\}\}/g, this.escape(data.bodyContent));
      template = template.replace(/\{\{CLOSING\}\}/g, this.escape(data.closing || 'Sincerely,'));
      template = template.replace(/\{\{SIGNATURE_BLOCK\}\}/g, this.escape(data.signatureBlock || ''));

      return template;
    } catch (error) {
      console.error('Error generating letter:', error);
      throw new Error('Failed to generate letter');
    }
  }

  /**
   * Generate project proposal
   */
  async generateProposal(data: ProposalData): Promise<string> {
    const templatePath = path.join(TEMPLATE_DIR, 'project-proposal.tex');

    try {
      let template = await fs.readFile(templatePath, 'utf-8');

      template = template.replace(/\{\{PROJECT_TITLE\}\}/g, this.escape(data.projectTitle));
      template = template.replace(/\{\{PROJECT_SUBTITLE\}\}/g, this.escape(data.projectSubtitle || ''));
      template = template.replace(/\{\{AUTHOR_NAME\}\}/g, this.escape(data.authorName));
      template = template.replace(/\{\{ORGANIZATION\}\}/g, this.escape(data.organization));
      template = template.replace(/\{\{DATE\}\}/g, data.date || '\\today');
      template = template.replace(/\{\{EXECUTIVE_SUMMARY\}\}/g, this.escape(data.executiveSummary));
      template = template.replace(/\{\{PROJECT_OVERVIEW\}\}/g, this.escape(data.projectOverview));
      template = template.replace(/\{\{OBJECTIVES\}\}/g, this.escape(data.objectives));
      template = template.replace(/\{\{SCOPE\}\}/g, this.escape(data.scope));
      template = template.replace(/\{\{IN_SCOPE\}\}/g, this.escape(data.inScope || ''));
      template = template.replace(/\{\{OUT_OF_SCOPE\}\}/g, this.escape(data.outOfScope || ''));
      template = template.replace(/\{\{METHODOLOGY\}\}/g, this.escape(data.methodology));
      template = template.replace(/\{\{TIMELINE\}\}/g, this.escape(data.timeline));
      template = template.replace(/\{\{BUDGET\}\}/g, this.escape(data.budget));
      template = template.replace(/\{\{TEAM_RESOURCES\}\}/g, this.escape(data.teamResources));
      template = template.replace(/\{\{RISK_ASSESSMENT\}\}/g, this.escape(data.riskAssessment));
      template = template.replace(/\{\{SUCCESS_CRITERIA\}\}/g, this.escape(data.successCriteria));
      template = template.replace(/\{\{CONCLUSION\}\}/g, this.escape(data.conclusion));

      return template;
    } catch (error) {
      console.error('Error generating proposal:', error);
      throw new Error('Failed to generate proposal');
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
   * Get available document templates
   */
  getAvailableTemplates(): string[] {
    return [
      'technical-evidence-report',
      'professional-letter',
      'project-proposal'
    ];
  }
}

export const documentTemplateService = new DocumentTemplateService();
