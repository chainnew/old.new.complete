import { Editor } from '@monaco-editor/react';
import { useDocumentStore } from '../../stores/documentStore';
import { useState, useEffect } from 'react';

export function CodeView() {
  const { document, setMarkdown, setContent } = useDocumentStore();
  const [fadeIn, setFadeIn] = useState(true);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setMarkdown(value);
      setContent(value);
    }
  };

  // Trigger fade animation when markdown changes
  useEffect(() => {
    setFadeIn(false);
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, [document.markdown]);

  // Detect if content is LaTeX
  const isLatex = document.markdown?.includes('\\documentclass') ||
                  document.markdown?.includes('\\begin{document}');

  return (
    <div
      className="h-full p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      style={{
        backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)'
      }}
    >
      <div
        className={`h-full rounded-xl overflow-hidden shadow-2xl transition-opacity duration-300 ${
          fadeIn ? 'opacity-100' : 'opacity-70'
        }`}
        style={{
          boxShadow: `
            0 0 0 1px rgba(148, 163, 184, 0.1),
            0 10px 40px -10px rgba(0, 0, 0, 0.4),
            0 0 100px -20px rgba(139, 92, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `
        }}
      >
        <Editor
          height="100%"
          defaultLanguage={isLatex ? "latex" : "markdown"}
          value={document.markdown || document.content}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace',
            fontLigatures: true,
            minimap: { enabled: true },
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 20, bottom: 20, left: 4, right: 4 },
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: {
              enabled: true
            },
            guides: {
              bracketPairs: true,
              indentation: true
            }
          }}
        />
      </div>
    </div>
  );
}
