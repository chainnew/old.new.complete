import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-slate-900 border-t border-slate-700 p-4">
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Doco anything..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-slate-700 border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-100 placeholder-slate-400 rounded-lg px-4 py-3 resize-none focus:outline-none disabled:opacity-50"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="flex items-center gap-2"
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}
