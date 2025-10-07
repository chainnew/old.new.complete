import { useState } from 'react';
import { FileDown, Settings } from 'lucide-react';
import { useDocumentStore } from '../../stores/documentStore';
import { Button } from '../ui/Button';
import type { ExportFormat } from '../../types';

interface TopNavProps {
  onExport: (format: ExportFormat) => void;
}

export function TopNav({ onExport }: TopNavProps) {
  const { document, saveStatus, setTitle } = useDocumentStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTitle(e.target.value || 'Untitled Document');
    setIsEditingTitle(false);
  };

  const saveStatusConfig = {
    saved: { text: 'Saved', color: 'text-emerald-400' },
    saving: { text: 'Saving...', color: 'text-cyan-400 animate-pulse' },
    unsaved: { text: 'Unsaved', color: 'text-orange-400' },
  };

  const status = saveStatusConfig[saveStatus];

  return (
    <div className="bg-slate-900 border-b border-slate-700 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div className="text-2xl font-bold flex items-center gap-1">
          <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            old
          </span>
          <span className="text-slate-400">.</span>
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            new
          </span>
        </div>

        {isEditingTitle ? (
          <input
            type="text"
            defaultValue={document.title}
            autoFocus
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className="bg-slate-800 border border-blue-500 rounded px-2 py-1 text-slate-100 text-lg font-medium focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="text-slate-100 text-lg font-medium hover:text-white cursor-text"
          >
            {document.title}
          </button>
        )}

        <div className={`flex items-center gap-1.5 text-sm ${status.color}`}>
          {saveStatus === 'saved' && <span>✓</span>}
          <span>{status.text}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2"
          >
            <FileDown size={18} />
            Export
          </Button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50">
              {(['pdf', 'docx', 'markdown', 'html', 'txt'] as ExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => {
                    onExport(format);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="text-slate-400 hover:text-cyan-400 p-2 rounded transition-colors">
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}
