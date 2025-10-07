import { FileText } from 'lucide-react';
import { formatTimestamp } from '../../lib/utils';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  showTimestamp?: boolean;
}

export function MessageBubble({ message, showTimestamp = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-[80%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
              <FileText size={14} className="text-cyan-400" />
            </div>
            <span className="text-slate-400 text-xs">Doco</span>
          </div>
        )}

        <div
          className={`rounded-lg p-3 ${
            isUser
              ? 'gradient-cta text-white rounded-tr-sm'
              : 'bg-slate-700 text-slate-100 rounded-tl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {showTimestamp && (
          <div
            className={`text-slate-400 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
              isUser ? 'text-right' : 'text-left'
            }`}
          >
            {formatTimestamp(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}
