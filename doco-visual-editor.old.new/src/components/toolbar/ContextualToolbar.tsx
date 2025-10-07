import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Image,
  Link,
  Highlighter,
  Code,
  Search,
  Diff,
  Copy,
  MessageSquare,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface ContextualToolbarProps {
  activeTab: 'document' | 'code';
  visible: boolean;
  onFormat: (format: string) => void;
  onInsert: (type: string) => void;
  onAction: (action: string) => void;
}

export function ContextualToolbar({
  activeTab,
  visible,
  onFormat,
  onInsert,
  onAction,
}: ContextualToolbarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="contextual-toolbar bg-slate-800 border border-slate-700 rounded-lg shadow-xl px-2 py-1.5 flex items-center gap-1"
        >
          {activeTab === 'document' ? (
            <>
              {/* Text Formatting */}
              <div className="flex items-center gap-0.5 pr-2 border-r border-slate-700">
                <button
                  onClick={() => onFormat('bold')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Bold (⌘B)"
                >
                  <Bold size={16} />
                </button>
                <button
                  onClick={() => onFormat('italic')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Italic (⌘I)"
                >
                  <Italic size={16} />
                </button>
                <button
                  onClick={() => onFormat('underline')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Underline (⌘U)"
                >
                  <Underline size={16} />
                </button>
              </div>

              {/* Headings */}
              <div className="flex items-center gap-0.5 pr-2 border-r border-slate-700">
                <button
                  onClick={() => onFormat('h1')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Heading 1"
                >
                  <Heading1 size={16} />
                </button>
                <button
                  onClick={() => onFormat('h2')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Heading 2"
                >
                  <Heading2 size={16} />
                </button>
              </div>

              {/* Lists */}
              <div className="flex items-center gap-0.5 pr-2 border-r border-slate-700">
                <button
                  onClick={() => onFormat('bulletList')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Bullet List"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => onFormat('orderedList')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Numbered List"
                >
                  <ListOrdered size={16} />
                </button>
              </div>

              {/* Insert */}
              <div className="flex items-center gap-0.5 pr-2 border-r border-slate-700">
                <button
                  onClick={() => onInsert('image')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Insert Image"
                >
                  <Image size={16} />
                </button>
                <button
                  onClick={() => onInsert('link')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Insert Link"
                >
                  <Link size={16} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onAction('highlight')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Highlight Changes"
                >
                  <Highlighter size={16} />
                </button>
                <button
                  onClick={() => onAction('zoom-in')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => onAction('zoom-out')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={() => onAction('send-to-chat')}
                  className="p-1.5 hover:bg-cyan-600 bg-cyan-500 rounded text-white transition-colors ml-1"
                  title="Send to Chat"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Code View Tools */}
              <div className="flex items-center gap-0.5 pr-2 border-r border-slate-700">
                <button
                  onClick={() => onAction('find')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Find (⌘F)"
                >
                  <Search size={16} />
                </button>
                <button
                  onClick={() => onAction('code-format')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Format Code"
                >
                  <Code size={16} />
                </button>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onAction('diff')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Show Diff"
                >
                  <Diff size={16} />
                </button>
                <button
                  onClick={() => onAction('copy')}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                  title="Copy Code"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => onAction('send-to-chat')}
                  className="p-1.5 hover:bg-cyan-600 bg-cyan-500 rounded text-white transition-colors ml-1"
                  title="Send to Chat"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
