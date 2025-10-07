import { useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useDocumentStore } from '../../stores/documentStore';
import { DocoAvatar } from './DocoAvatar';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { ChatToolbar } from '../toolbar/ChatToolbar';
import { StopCircle } from 'lucide-react';

interface ChatPanelProps {
  onSendMessage: (message: string) => void;
  onStopGeneration?: () => void;
}

export function ChatPanel({ onSendMessage, onStopGeneration }: ChatPanelProps) {
  const { messages, docoState, streamingMessage, clearMessages } = useChatStore();
  const { selectedText } = useDocumentStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  return (
    <div className="bg-slate-800 border-r border-slate-700 flex flex-col h-full">
      <DocoAvatar state={docoState} />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !streamingMessage && (
          <div className="text-slate-400 text-center py-8 px-4">
            <p className="text-lg mb-2">Hi! I'm Doco!</p>
            <p className="text-sm">
              Upload a document or start typing, and I'll help you make it amazing!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} showTimestamp />
        ))}

        {streamingMessage && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingMessage,
              timestamp: Date.now(),
            }}
          />
        )}

        {docoState === 'thinking' && !streamingMessage && (
          <div className="flex items-center gap-2 text-slate-400">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">Doco is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Stop Generation Button */}
      {(docoState === 'thinking' || streamingMessage) && onStopGeneration && (
        <div className="px-4 pb-2 flex justify-center">
          <button
            onClick={onStopGeneration}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/50 font-medium"
          >
            <StopCircle size={18} />
            <span>Stop Generating</span>
          </button>
        </div>
      )}

      {selectedText && (
        <div className="px-4 pb-2">
          <div className="bg-slate-700 border border-cyan-500 text-cyan-400 text-xs px-3 py-1.5 rounded-full inline-block">
            Selected: {selectedText.slice(0, 30)}...
          </div>
        </div>
      )}

      <ChatToolbar
        onQuickAction={onSendMessage}
        onClearChat={clearMessages}
        disabled={docoState === 'thinking'}
      />
      <ChatInput onSend={onSendMessage} disabled={docoState === 'thinking'} />
    </div>
  );
}
