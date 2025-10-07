import { useState } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { useChatStore } from '../../stores/chatStore';
import { TabBar } from './TabBar';
import { DocumentView } from './DocumentView';
import { CodeView } from './CodeView';
import { ContextualToolbar } from '../toolbar/ContextualToolbar';

export function EditorContainer() {
  const { activeTab, setActiveTab, selectedText, setContent, document } = useDocumentStore();
  const { addMessage } = useChatStore();
  const [showContextualToolbar, setShowContextualToolbar] = useState(true);

  const handleFormat = (format: string) => {
    addMessage('assistant', `Applying ${format} formatting...`);
  };

  const handleInsert = (type: string) => {
    addMessage('assistant', `Insert ${type} feature coming soon!`);
  };

  const handleAction = (action: string) => {
    if (action === 'send-to-chat' && selectedText) {
      addMessage('user', `Help me improve this: "${selectedText}"`);
    } else if (action === 'copy') {
      navigator.clipboard.writeText(document.content);
      addMessage('assistant', 'Code copied to clipboard!');
    } else {
      addMessage('assistant', `${action} feature coming soon!`);
    }
  };

  return (
    <div className="bg-slate-900 flex flex-col h-full">
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="relative">
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
          <ContextualToolbar
            activeTab={activeTab}
            visible={showContextualToolbar}
            onFormat={handleFormat}
            onInsert={handleInsert}
            onAction={handleAction}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'document' ? <DocumentView /> : <CodeView />}
      </div>
    </div>
  );
}
