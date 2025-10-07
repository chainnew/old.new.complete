import { FileText, Code2 } from 'lucide-react';
import type { EditorTab } from '../../types';

interface TabBarProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs = [
    { id: 'document' as EditorTab, label: 'Document', icon: FileText },
    { id: 'code' as EditorTab, label: 'Code', icon: Code2 },
  ];

  return (
    <div className="bg-slate-800 border-b border-slate-700 flex items-center px-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'text-white border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          <tab.icon size={18} />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
