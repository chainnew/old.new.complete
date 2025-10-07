import { useEffect } from 'react';
import { useDocumentStore } from '../stores/documentStore';

export function useAutoSave() {
  const { document, saveStatus, saveDocument, setSaveStatus } = useDocumentStore();

  useEffect(() => {
    if (saveStatus === 'unsaved') {
      setSaveStatus('saving');

      const timer = setTimeout(() => {
        saveDocument();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [document.content, document.markdown, saveStatus]);
}
