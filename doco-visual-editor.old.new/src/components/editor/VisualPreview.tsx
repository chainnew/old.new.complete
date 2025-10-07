import { useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import mermaid from 'mermaid';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
});

export function VisualPreview() {
  const { document } = useDocumentStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [renderType, setRenderType] = useState<'html' | 'mermaid' | 'text'>('html');
  const [mermaidSvg, setMermaidSvg] = useState('');

  // Detect content type
  useEffect(() => {
    const content = document.markdown || document.content;

    if (content?.includes('<!DOCTYPE html') || content?.includes('<html')) {
      setRenderType('html');
    } else if (
      content?.includes('graph') ||
      content?.includes('flowchart') ||
      content?.includes('sequenceDiagram') ||
      content?.includes('classDiagram') ||
      content?.includes('stateDiagram') ||
      content?.includes('erDiagram') ||
      content?.includes('gantt') ||
      content?.includes('pie')
    ) {
      setRenderType('mermaid');
    } else {
      setRenderType('text');
    }
  }, [document.markdown, document.content]);

  // Render HTML in iframe
  useEffect(() => {
    if (renderType === 'html' && iframeRef.current) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

      if (iframeDoc) {
        const htmlContent = document.markdown || document.content || '';
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
      }
    }
  }, [document.markdown, document.content, renderType]);

  // Render Mermaid diagram
  useEffect(() => {
    if (renderType === 'mermaid' && mermaidRef.current) {
      const content = document.markdown || document.content || '';

      // Generate unique ID for this diagram
      const id = `mermaid-${Date.now()}`;

      mermaid.render(id, content)
        .then(({ svg }) => {
          setMermaidSvg(svg);
        })
        .catch((error) => {
          console.error('Mermaid rendering error:', error);
          setMermaidSvg(`<div style="color: #ef4444; padding: 2rem; text-align: center;">
            <h3>Diagram Rendering Error</h3>
            <pre style="text-align: left; background: #1f2937; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
              ${error.message || 'Invalid Mermaid syntax'}
            </pre>
          </div>`);
        });
    }
  }, [document.markdown, document.content, renderType]);

  if (renderType === 'html') {
    return (
      <div className="h-full w-full bg-white">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Document Preview"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    );
  }

  if (renderType === 'mermaid') {
    return (
      <div className="h-full w-full bg-white overflow-auto">
        <div
          className="p-8 flex items-center justify-center min-h-full"
          ref={mermaidRef}
          dangerouslySetInnerHTML={{ __html: mermaidSvg }}
        />
      </div>
    );
  }

  // Fallback: render as plain text with nice formatting
  return (
    <div className="h-full w-full bg-white overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div
          className="prose prose-slate prose-lg"
          dangerouslySetInnerHTML={{
            __html: (document.content || '').replace(/\n/g, '<br/>')
          }}
        />
      </div>
    </div>
  );
}
