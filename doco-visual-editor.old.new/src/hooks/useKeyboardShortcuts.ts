import { useEffect } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { useChatStore } from '../stores/chatStore';

export function useKeyboardShortcuts() {
  const { setActiveTab, saveDocument, setContent, document } = useDocumentStore();
  const { addMessage } = useChatStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.shiftKey) {
        if (e.key === 'D' || e.key === 'd') {
          e.preventDefault();
          setActiveTab('document');
        } else if (e.key === 'C' || e.key === 'c') {
          e.preventDefault();
          setActiveTab('code');
        } else if (e.key === 'Z') {
          e.preventDefault();
        }
      }

      if (isMod && !e.shiftKey) {
        if (e.key === 's') {
          e.preventDefault();
          saveDocument();
        } else if (e.key === 'n') {
          e.preventDefault();
          setContent('');
          addMessage('assistant', 'Started a new document!');
        } else if (e.key === 'z') {
          e.preventDefault();
        } else if (e.key === 'f') {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, saveDocument, setContent, addMessage, document]);
}
