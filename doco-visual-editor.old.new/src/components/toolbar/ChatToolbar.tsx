import { Sparkles, Wand2, TrendingUp, Palette, FileText, History, Trash2 } from 'lucide-react';

interface ChatToolbarProps {
  onQuickAction: (action: string) => void;
  onClearChat: () => void;
  disabled?: boolean;
}

export function ChatToolbar({ onQuickAction, onClearChat, disabled }: ChatToolbarProps) {
  const quickActions = [
    {
      id: 'polish',
      label: 'Polish Grammar',
      icon: Sparkles,
      prompt: 'Please polish the grammar and improve clarity of this document.',
      color: 'hover:bg-cyan-600',
    },
    {
      id: 'tone',
      label: 'Improve Tone',
      icon: Palette,
      prompt: 'Please improve the tone and make it more professional.',
      color: 'hover:bg-blue-600',
    },
    {
      id: 'enhance',
      label: 'Quick Enhance',
      icon: Wand2,
      prompt: 'Please enhance this document with better structure and flow.',
      color: 'hover:bg-purple-600',
    },
    {
      id: 'optimize',
      label: 'Optimize',
      icon: TrendingUp,
      prompt: 'Please optimize this document for readability and impact.',
      color: 'hover:bg-emerald-600',
    },
    {
      id: 'summarize',
      label: 'Summarize',
      icon: FileText,
      prompt: 'Please provide a concise summary of this document.',
      color: 'hover:bg-orange-600',
    },
  ];

  return (
    <div className="chat-toolbar bg-slate-800 border-t border-slate-700 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onQuickAction(action.prompt)}
              disabled={disabled}
              className={`px-2.5 py-1.5 bg-slate-700 ${action.color} text-slate-200 hover:text-white rounded text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed`}
              title={action.label}
            >
              <action.icon size={14} />
              {action.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClearChat}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
