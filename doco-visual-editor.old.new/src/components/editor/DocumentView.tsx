import { useEffect, useRef } from 'react';
import { useDocumentStore } from '../../stores/documentStore';

export function DocumentView() {
  const { document } = useDocumentStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('[DocumentView] Content updated:', document.content?.substring(0, 100));
  }, [document.content]);

  useEffect(() => {
    // Auto-scroll to bottom smoothly as content updates
    if (containerRef.current && contentRef.current) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          const scrollHeight = containerRef.current.scrollHeight;
          const currentScroll = containerRef.current.scrollTop;
          const clientHeight = containerRef.current.clientHeight;

          // Only auto-scroll if user is near the bottom (within 200px)
          const isNearBottom = scrollHeight - currentScroll - clientHeight < 200;

          if (isNearBottom) {
            containerRef.current.scrollTo({
              top: scrollHeight,
              behavior: 'smooth'
            });
          }
        }
      });
    }
  }, [document.content]);

  return (
    <div
      ref={containerRef}
      className="p-8 overflow-y-auto h-full scroll-smooth bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)'
      }}
    >
      <div className="max-w-5xl mx-auto">
        <style>{`
          .document-canvas {
            background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
            box-shadow:
              0 0 0 1px rgba(0, 0, 0, 0.05),
              0 10px 40px -10px rgba(0, 0, 0, 0.3),
              0 0 100px -20px rgba(59, 130, 246, 0.15);
            transition: all 0.3s ease;
          }

          .document-canvas:hover {
            box-shadow:
              0 0 0 1px rgba(0, 0, 0, 0.08),
              0 15px 50px -10px rgba(0, 0, 0, 0.35),
              0 0 120px -15px rgba(59, 130, 246, 0.2);
            transform: translateY(-2px);
          }

          .document-preview h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #0f172a;
            margin: 1.5rem 0 1rem 0;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 0.5rem;
            letter-spacing: -0.02em;
          }
          .document-preview h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
            margin: 1.25rem 0 0.75rem 0;
            border-bottom: 2px solid #94a3b8;
            padding-bottom: 0.25rem;
            letter-spacing: -0.01em;
          }
          .document-preview h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #334155;
            margin: 1rem 0 0.5rem 0;
          }
          .document-preview p {
            margin: 0.75rem 0;
            line-height: 1.8;
            color: #1e293b;
          }
          .document-preview strong {
            font-weight: 600;
            color: #0f172a;
          }
          .document-preview ul, .document-preview ol {
            margin: 0.75rem 0 0.75rem 1.5rem;
            line-height: 1.8;
          }
          .document-preview li {
            margin: 0.35rem 0;
            color: #334155;
          }
          .document-preview a {
            color: #3b82f6;
            text-decoration: none;
            border-bottom: 1px solid rgba(59, 130, 246, 0.3);
            transition: all 0.2s;
          }
          .document-preview a:hover {
            border-bottom-color: #3b82f6;
            color: #2563eb;
          }

          @media print {
            .document-canvas {
              box-shadow: none;
            }
          }
        `}</style>
        <div
          ref={contentRef}
          className="document-preview document-canvas rounded-xl min-h-[1056px] p-16 mb-8"
          dangerouslySetInnerHTML={{
            __html: document.content || '<p style="color: #94a3b8; font-style: italic; text-align: center; padding: 4rem;">Your enhanced document will appear here...</p>'
          }}
          style={{
            fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            fontSize: '15px',
            lineHeight: '1.8',
            width: '8.5in',
            minHeight: '11in'
          }}
        />
      </div>
    </div>
  );
}
