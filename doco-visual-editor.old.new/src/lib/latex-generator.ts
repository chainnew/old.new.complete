import { AIService, AIMessage } from './ai-service';

interface LatexTemplate {
  name: string;
  class: string;
  packages: string[];
  structure: {
    header: string;
    sections: string[];
  };
}

interface LatexGeneratorOptions {
  templateId: string;
  options?: Record<string, any>;
}

export class LatexGenerator {
  private enhancementEngine: AIService;
  private templates: Map<string, LatexTemplate>;

  constructor(apiKey: string) {
    this.enhancementEngine = new AIService(apiKey);
    this.templates = new Map();
    this.loadTemplates();
  }

  private loadTemplates() {
    // WORLD-CLASS TEMPLATES - Premium LaTeX formatting

    // 1. Blue Horizon - Professional Blue Theme
    // Features: Navy blue headers, FontAwesome icons, ruled sections
    this.templates.set('blue-horizon', {
      name: 'Blue Horizon - Professional',
      class: 'article',
      packages: ['geometry', 'inputenc', 'enumitem', 'titlesec', 'fontawesome5', 'xcolor'],
      structure: {
        header: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{fontawesome5}
\\usepackage[dvipsnames]{xcolor}

% Blue Horizon color scheme
\\definecolor{sectionblue}{RGB}{37,99,235}
\\definecolor{textblue}{RGB}{59,130,246}
\\definecolor{textgray}{RGB}{60,60,60}

\\titleformat{\\section}{\\large\\bfseries\\color{textgray}}{\\thesection}{0em}{}[{\\color{sectionblue}\\titlerule[0.8pt]}]
\\titlespacing*{\\section}{0pt}{12pt}{6pt}

\\setlist[itemize]{leftmargin=*,noitemsep,topsep=2pt,itemsep=3pt}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}`,
        sections: ['\\section*{PROFESSIONAL SUMMARY}', '\\section*{PROFESSIONAL EXPERIENCE}', '\\section*{EDUCATION}', '\\section*{CORE COMPETENCIES}']
      }
    });

    // 2. Sleek Monochrome - Modern Grayscale
    // Features: Minimalist grayscale, hyperlinked contact info
    this.templates.set('sleek-monochrome', {
      name: 'Sleek Monochrome',
      class: 'article',
      packages: ['geometry', 'inputenc', 'hyperref', 'enumitem', 'sectsty', 'titlesec', 'xcolor'],
      structure: {
        header: `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{sectsty}
\\usepackage{titlesec}
\\usepackage{xcolor}

% Sleek Monochrome color scheme
\\definecolor{headercolor}{RGB}{31,41,55}
\\definecolor{linkcolor}{RGB}{75,85,99}
\\definecolor{sectiongray}{RGB}{100,100,100}

% Hyperlink setup
\\hypersetup{
    colorlinks=true,
    linkcolor=linkcolor,
    urlcolor=linkcolor
}

% Section formatting
\\sectionfont{\\color{headercolor}\\Large\\bfseries}
\\subsectionfont{\\color{headercolor}\\normalsize\\bfseries}
\\titleformat{\\section}{\\Large\\bfseries\\color{headercolor}}{}{0em}{}[\\titlerule]

% Custom lists for compactness
\\setlist[itemize]{leftmargin=*,itemsep=0pt,parsep=0pt,topsep=0pt}

% No page numbers
\\pagenumbering{gobble}`,
        sections: ['\\section{Professional Summary}', '\\section{Professional Experience}', '\\section{Education}', '\\section{Technical Competencies}']
      }
    });

    // 3. Modern Sidebar - Teal Theme
    // Features: Teal accents, modern layout, FontAwesome icons
    this.templates.set('modern-sidebar', {
      name: 'Modern Sidebar - Teal',
      class: 'article',
      packages: ['geometry', 'inputenc', 'enumitem', 'titlesec', 'fontawesome5', 'xcolor'],
      structure: {
        header: `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{fontawesome5}
\\usepackage[dvipsnames]{xcolor}

% Modern Sidebar - Teal color scheme
\\definecolor{sectionteal}{RGB}{13,148,136}
\\definecolor{textteal}{RGB}{20,184,166}
\\definecolor{textgray}{RGB}{60,60,60}

\\titleformat{\\section}{\\large\\bfseries\\color{textgray}}{\\thesection}{0em}{}[{\\color{sectionteal}\\titlerule[0.8pt]}]
\\titlespacing*{\\section}{0pt}{12pt}{6pt}

\\setlist[itemize]{leftmargin=*,noitemsep,topsep=2pt,itemsep=3pt}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}`,
        sections: ['\\section*{PROFESSIONAL SUMMARY}', '\\section*{PROFESSIONAL EXPERIENCE}', '\\section*{EDUCATION}', '\\section*{CORE COMPETENCIES}']
      }
    });

    // 4. Executive Professional Resume (Legacy - kept for backwards compatibility)
    // Features: Dark blue headers, ruled sections, compact itemize, hyperlinks
    this.templates.set('resume', {
      name: 'Executive Professional Resume',
      class: 'article',
      packages: ['geometry', 'inputenc', 'fontenc', 'hyperref', 'enumitem', 'sectsty', 'titlesec', 'xcolor'],
      structure: {
        header: `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{sectsty}
\\usepackage{titlesec}
\\usepackage{xcolor}

% Define colors - Dark blue professional palette
\\definecolor{headercolor}{RGB}{0, 51, 102}  % Dark blue for headers
\\definecolor{linkcolor}{RGB}{0, 51, 102}

% Hyperlink setup
\\hypersetup{
    colorlinks=true,
    linkcolor=linkcolor,
    urlcolor=linkcolor
}

% Section formatting with ruled lines
\\sectionfont{\\color{headercolor}\\Large\\bfseries}
\\subsectionfont{\\color{headercolor}\\normalsize\\bfseries}
\\titleformat{\\section}{\\Large\\bfseries\\color{headercolor}}{}{0em}{}[\\titlerule]

% Custom lists for compactness - critical for ATS and readability
\\setlist[itemize]{leftmargin=*,itemsep=0pt,parsep=0pt,topsep=0pt}

% No page numbers
\\pagenumbering{gobble}`,
        sections: ['\\section{Professional Summary}', '\\section{Professional Experience}', '\\section{Education}', '\\section{Technical Competencies}']
      }
    });

    // 2. Subtle & Clean (Finish 1) - Icons, modern font, aligned dates
    this.templates.set('modern-resume', {
      name: 'Subtle & Clean with Icons',
      class: 'article',
      packages: ['geometry', 'inputenc', 'fontenc', 'hyperref', 'enumitem', 'sectsty', 'titlesec', 'xcolor', 'fontawesome5'],
      structure: {
        header: `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{sectsty}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{fontawesome5}  % For professional icons

% Define colors
\\definecolor{headercolor}{RGB}{0, 51, 102}
\\definecolor{linkcolor}{RGB}{0, 51, 102}

% Hyperlink setup
\\hypersetup{
    colorlinks=true,
    linkcolor=linkcolor,
    urlcolor=linkcolor
}

% Section formatting
\\sectionfont{\\color{headercolor}\\Large\\bfseries}
\\subsectionfont{\\color{headercolor}\\normalsize\\bfseries}
\\titleformat{\\section}{\\Large\\bfseries\\color{headercolor}}{}{0em}{}[\\titlerule]

% Custom lists for compactness
\\setlist[itemize]{leftmargin=*,itemsep=0pt,parsep=0pt,topsep=0pt}

% No page numbers
\\pagenumbering{gobble}`,
        sections: ['\\section{Professional Summary}', '\\section{Professional Experience}', '\\section{Education}', '\\section{Technical Competencies}']
      }
    });

    // Additional variant: Modern & Structured (Finish 2) - Columns, vertical bars
    this.templates.set('modern-structured', {
      name: 'Modern & Structured',
      class: 'article',
      packages: ['geometry', 'inputenc', 'fontenc', 'hyperref', 'enumitem', 'sectsty', 'titlesec', 'xcolor', 'fontawesome5', 'multicol'],
      structure: {
        header: `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{sectsty}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{fontawesome5}
\\usepackage{multicol}  % For multi-column layouts

% Define colors
\\definecolor{headercolor}{RGB}{0, 51, 102}
\\definecolor{linkcolor}{RGB}{0, 51, 102}

% Hyperlink setup
\\hypersetup{
    colorlinks=true,
    linkcolor=linkcolor,
    urlcolor=linkcolor
}

% Modern section style with vertical bar
\\titleformat{\\section}
  {\\Large\\bfseries\\color{headercolor}}
  {}
  {0em}
  {\\color{headercolor}\\rule[-0.1ex]{2pt}{2.5ex}\\hspace{0.5em}}
  []

\\subsectionfont{\\color{headercolor}\\normalsize\\bfseries}

% Custom lists for compactness
\\setlist[itemize]{leftmargin=*,itemsep=0pt,parsep=0pt,topsep=0pt}

% No page numbers
\\pagenumbering{gobble}`,
        sections: ['\\section{Professional Summary}', '\\section{Professional Experience}', '\\section{Education}', '\\section{Technical Competencies}']
      }
    });

    // 3. Sidebar Layout (Finish 3) - Two-column with sidebar
    this.templates.set('creative-resume', {
      name: 'Sidebar Layout',
      class: 'article',
      packages: ['geometry', 'inputenc', 'fontenc', 'hyperref', 'enumitem', 'titlesec', 'xcolor', 'fontawesome5', 'paracol'],
      structure: {
        header: `\\documentclass[11pt,a4paper]{article}
\\usepackage[left=0.5in,top=0.5in,right=0.5in,bottom=0.5in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{fontawesome5}
\\usepackage{paracol}  % Two-column layout

% Define colors
\\definecolor{headercolor}{RGB}{0, 51, 102}
\\definecolor{sidebarcolor}{RGB}{240, 245, 250}
\\definecolor{linkcolor}{RGB}{0, 51, 102}

% Hyperlink setup
\\hypersetup{
    colorlinks=true,
    linkcolor=linkcolor,
    urlcolor=linkcolor
}

% Section formatting for main content
\\titleformat{\\section}
  {\\Large\\bfseries\\color{headercolor}}
  {}
  {0em}
  {}
  [\\titlerule]

% Subsection formatting
\\titleformat{\\subsection}
  {\\normalsize\\bfseries\\color{headercolor}}
  {}
  {0em}
  {}

% Custom lists
\\setlist[itemize]{leftmargin=*,itemsep=0pt,parsep=0pt,topsep=0pt}

% No page numbers
\\pagenumbering{gobble}

% Column widths (30% sidebar, 65% main)
\\setcolumnwidth{0.3\\textwidth, 0.65\\textwidth}

% Sidebar background color
\\backgroundcolor{c[0](4pt,4pt)(0.5\\columnsep,4pt)}{sidebarcolor}`,
        sections: ['\\section{Professional Summary}', '\\section{Professional Experience}', '\\section*{Contact}', '\\section*{Education}', '\\section*{Key Competencies}']
      }
    });

    // 4. Elegant Timeline (Finish 4) - Visual career progression
    this.templates.set('timeline-resume', {
      name: 'Elegant Timeline',
      class: 'article',
      packages: ['geometry', 'inputenc', 'fontenc', 'hyperref', 'enumitem', 'sectsty', 'titlesec', 'xcolor', 'tabularx'],
      structure: {
        header: `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{sectsty}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{tabularx}

% Define colors
\\definecolor{headercolor}{RGB}{0, 51, 102}
\\definecolor{linkcolor}{RGB}{0, 51, 102}

% Hyperlink setup
\\hypersetup{
    colorlinks=true,
    linkcolor=linkcolor,
    urlcolor=linkcolor
}

% Section formatting
\\sectionfont{\\color{headercolor}\\Large\\bfseries}
\\titleformat{\\section}{\\Large\\bfseries\\color{headercolor}}{}{0em}{}[\\titlerule]

% Subsection with no color (handled in timeline command)
\\subsectionfont{\\normalsize\\bfseries}

% Custom lists
\\setlist[itemize]{leftmargin=*,itemsep=0pt,parsep=0pt,topsep=0pt}

% No page numbers
\\pagenumbering{gobble}

% Timeline entry command
% #1: Title, #2: Company & Location, #3: Dates, #4: Description
\\newcommand{\\timelineentry}[4]{
    \\noindent\\begin{tabularx}{\\textwidth}{@{}p{2.5cm} X@{}}
        \\multicolumn{2}{@{}l@{}}{\\subsection{#1}} \\\\
        \\textit{#3} & \\textbf{#2} \\\\
        & #4
    \\end{tabularx}
    \\vspace{1em}
}`,
        sections: ['\\section{Professional Summary}', '\\section{Professional Experience}', '\\section{Education}', '\\section{Technical Competencies}']
      }
    });

    // 5. Scholarly Minimalist (Finish 5) - Typography-focused, clean
    this.templates.set('scholarly-resume', {
      name: 'Scholarly Minimalist',
      class: 'article',
      packages: ['geometry', 'inputenc', 'fontenc', 'hyperref', 'enumitem', 'sectsty', 'titlesec'],
      structure: {
        header: `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1.2in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{sectsty}
\\usepackage{titlesec}

% Remove color - pure black and white
\\hypersetup{
    colorlinks=true,
    linkcolor=black,
    urlcolor=black
}

% Section formatting - minimal with space
\\sectionfont{\\Large\\bfseries}
\\subsectionfont{\\normalsize\\bfseries}
\\titleformat{\\section}{\\Large\\bfseries}{}{0em}{}[\\vspace{0.5em}\\titlerule]

% Custom lists with more breathing room
\\setlist[itemize]{leftmargin=*,itemsep=2pt,parsep=2pt,topsep=4pt}

% No page numbers
\\pagenumbering{gobble}

% Increased line spacing for readability
\\linespread{1.1}`,
        sections: ['\\section{Professional Summary}', '\\section{Professional Experience}', '\\section{Education}', '\\section{Technical Competencies}']
      }
    });

    // 6. Competency Matrix (Finish 6) - Table-based skills display
    this.templates.set('matrix-resume', {
      name: 'Competency Matrix',
      class: 'article',
      packages: ['geometry', 'inputenc', 'fontenc', 'hyperref', 'enumitem', 'sectsty', 'titlesec', 'xcolor', 'booktabs', 'tabularx'],
      structure: {
        header: `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{sectsty}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{booktabs}
\\usepackage{tabularx}

% Define colors
\\definecolor{headercolor}{RGB}{0, 51, 102}
\\definecolor{linkcolor}{RGB}{0, 51, 102}

% Hyperlink setup
\\hypersetup{
    colorlinks=true,
    linkcolor=linkcolor,
    urlcolor=linkcolor
}

% Section formatting
\\sectionfont{\\color{headercolor}\\Large\\bfseries}
\\subsectionfont{\\color{headercolor}\\normalsize\\bfseries}
\\titleformat{\\section}{\\Large\\bfseries\\color{headercolor}}{}{0em}{}[\\titlerule]

% Custom lists
\\setlist[itemize]{leftmargin=*,itemsep=0pt,parsep=0pt,topsep=0pt}

% No page numbers
\\pagenumbering{gobble}`,
        sections: ['\\section{Professional Summary}', '\\section{Technical Competencies}', '\\section{Professional Experience}', '\\section{Education}']
      }
    });

    // 7. Personal Brand (Finish 7) - Accent color with monogram
    this.templates.set('brand-resume', {
      name: 'Personal Brand Accent',
      class: 'article',
      packages: ['geometry', 'inputenc', 'fontenc', 'hyperref', 'enumitem', 'sectsty', 'titlesec', 'xcolor', 'tabularx'],
      structure: {
        header: `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{sectsty}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{tabularx}

% Define colors - primary + accent
\\definecolor{headercolor}{RGB}{0, 51, 102}
\\definecolor{accentcolor}{RGB}{204, 102, 0}  % Burnt orange accent
\\definecolor{linkcolor}{RGB}{0, 51, 102}

% Hyperlink setup
\\hypersetup{
    colorlinks=true,
    linkcolor=linkcolor,
    urlcolor=linkcolor
}

% Section formatting
\\sectionfont{\\color{headercolor}\\Large\\bfseries}
\\subsectionfont{\\color{headercolor}\\normalsize\\bfseries}
\\titleformat{\\section}{\\Large\\bfseries\\color{headercolor}}{}{0em}{}[\\titlerule]

% Custom lists with ACCENT COLOR bullets
\\setlist[itemize]{leftmargin=*, itemsep=0pt, parsep=0pt, topsep=0pt, label={\\color{accentcolor}\\textbullet}}

% No page numbers
\\pagenumbering{gobble}`,
        sections: ['\\section{Professional Summary}', '\\section{Professional Experience}', '\\section{Education}', '\\section{Technical Competencies}']
      }
    });
  }

  async *streamLatexGeneration(content: string, options: LatexGeneratorOptions): AsyncGenerator<string> {
    const template = this.templates.get(options.templateId);
    if (!template) {
      throw new Error(`Template ${options.templateId} not found`);
    }

    const prompt = `You are a WORLD-CLASS LaTeX expert specializing in creating STUNNING, PROFESSIONAL resumes.

Your mission: Transform this content into a GODLIKE ${template.name} following this EXACT template style.

CONTENT TO TRANSFORM:
${content}

TEMPLATE SPECIFICATIONS (MUST FOLLOW EXACTLY):
${template.structure.header}

CRITICAL FORMATTING REQUIREMENTS:

1. **HEADER SECTION** (center-aligned):
   \\begin{center}
   {\\Huge\\bfseries\\color{headercolor} [NAME]} \\\\[0.2em]
   {\\Large [JOB TITLE/TAGLINE]} \\\\[1em]
   {\\normalsize
       \\textbf{Contact:} [phone] \\quad | \\quad
       \\href{mailto:[email]}{[email]} \\quad | \\quad
       \\href{[linkedin url]}{[linkedin]} \\quad | \\quad
       [Location]
   }
   \\end{center}
   \\vspace{0.5em}
   \\rule{\\textwidth}{0.4pt}

2. **SECTION STRUCTURE**:
   - Use \\section{Professional Summary} (auto-styled with ruled line)
   - Use \\subsection{Job Title} for each role
   - Company/location/dates: \\textbf{Company, Location} \\\\ \\textit{Dates}

3. **BULLET POINTS** (compact lists):
   \\begin{itemize}
   \\item Achievement with metrics and impact
   \\item Start with strong action verbs
   \\item Quantify results where possible
   \\end{itemize}

4. **EDUCATION**:
   \\begin{itemize}[label={}]
   \\item \\textbf{Degree Name} (Year)
   \\item \\textbf{Institution}: Name/URL
   \\end{itemize}

5. **TECHNICAL COMPETENCIES**:
   \\begin{itemize}[label={}]
   \\item Skill Category 1
   \\item Skill Category 2
   \\end{itemize}

6. **HYPERLINKS**:
   - Email: \\href{mailto:address}{address}
   - LinkedIn: \\href{url}{linkedin.com/in/username}
   - All links use headercolor (dark blue)

7. **COLOR SCHEME**:
   - Headers: \\color{headercolor} (RGB 0,51,102 - dark blue)
   - Links: Same dark blue
   - Body text: Default black

8. **SPACING**:
   - Compact itemize (no extra spacing)
   - 0.5em between sections
   - Ruled lines under main sections

OUTPUT REQUIREMENTS:
- Return COMPLETE LaTeX code (\\documentclass to \\end{document})
- NO explanations, NO markdown formatting
- ONLY pure LaTeX code ready to compile
- Escape special characters properly (&, %, $, #, etc.)
- Use proper LaTeX quotes (\`\` and '')
- Follow template structure EXACTLY

This should look like a $500/hour professional resume. Every detail matters!

GENERATE THE COMPLETE LaTeX CODE NOW:`;

    // Use the AI service to stream the response
    const messages: AIMessage[] = [{ role: 'user' as const, content: prompt }];
    let fullResponse = '';

    // Simulate streaming by calling the AI service
    // Note: This would need to be adapted to use the actual streaming callback
    // For now, we'll assume a synchronous call and yield chunks
    try {
      // Placeholder for streaming - in practice, integrate with AIService's streamChat
      // Note: streamChat is async but doesn't return a value here; adjust for proper streaming
      await new Promise<void>((resolve, reject) => {
        this.enhancementEngine.streamChat(messages, {
          onChunk: (chunk) => {
            fullResponse += chunk;
            // For async generator, yield would be here, but since it's callback-based, simulate
          },
          onComplete: (fullText) => {
            fullResponse = fullText;
            resolve();
          },
          onError: (error) => {
            reject(error);
          }
        });
      });

      // For async generator, we'd need to modify AIService to support async iteration
      // Simplified: yield the full response in chunks
      const words = fullResponse.split(' ');
      for (const word of words) {
        yield word + ' ';
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate LaTeX: ${errorMessage}`);
    }
  }

  async generateLatex(content: string, templateId: string = 'resume', options: LatexGeneratorOptions['options'] = {}): Promise<string> {
    let latexCode = '';
    try {
      for await (const token of this.streamLatexGeneration(content, { templateId, options })) {
        latexCode += token;
      }
      return latexCode;
    } catch (error) {
      throw error;
    }
  }
}