import { Sparkles, File as FileEdit, Target, ListTree } from 'lucide-react';

interface QuickActionsProps {
  onAction: (prompt: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    { icon: Sparkles, label: 'Enhance Grammar', prompt: 'Please improve the grammar and spelling in this document' },
    { icon: FileEdit, label: 'Improve Clarity', prompt: 'Make this text clearer and easier to understand' },
    { icon: Target, label: 'Make Professional', prompt: 'Rewrite this in a more professional tone' },
    { icon: ListTree, label: 'Structure Sections', prompt: 'Organize this document into clear sections with headings' },
  ];

  return (
    <div className="border-t border-slate-700 p-3 bg-slate-900">
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            className="flex items-center gap-2 bg-slate-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-400 text-slate-200 hover:text-white px-3 py-2 rounded text-sm transition-all text-left"
          >
            <action.icon size={16} />
            <span className="truncate">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
