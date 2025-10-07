import { Editor } from '@monaco-editor/react';
import { useDocumentStore } from '../../stores/documentStore';
import { useState, useEffect } from 'react';

export function VisualCodeView() {
  const { document, setMarkdown, setContent } = useDocumentStore();
  const [fadeIn, setFadeIn] = useState(true);
  const [codeType, setCodeType] = useState<'html' | 'mermaid' | 'json'>('html');

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

  // Auto-detect code type
  useEffect(() => {
    if (document.markdown?.includes('<!DOCTYPE html') || document.markdown?.includes('<html')) {
      setCodeType('html');
    } else if (document.markdown?.includes('graph') || document.markdown?.includes('flowchart') || document.markdown?.includes('sequenceDiagram')) {
      setCodeType('mermaid');
    } else if (document.markdown?.trim().startsWith('{')) {
      setCodeType('json');
    }
  }, [document.markdown]);

  const getLanguage = () => {
    return codeType;
  };

  const getTitle = () => {
    switch (codeType) {
      case 'html': return 'HTML/CSS Template';
      case 'mermaid': return 'Mermaid Diagram';
      case 'json': return 'Structured Data (JSON)';
      default: return 'Code';
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      style={{
        backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)'
      }}
    >
      {/* Header with code type indicator */}
      <div className="px-6 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
            {getTitle()}
          </h3>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              codeType === 'html' ? 'bg-orange-500/20 text-orange-300' :
              codeType === 'mermaid' ? 'bg-purple-500/20 text-purple-300' :
              'bg-green-500/20 text-green-300'
            }`}>
              {codeType.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6">
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
            language={getLanguage()}
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
    </div>
  );
}
