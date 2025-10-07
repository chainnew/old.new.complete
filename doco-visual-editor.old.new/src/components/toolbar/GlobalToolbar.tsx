import { useState } from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  Download,
  Search,
  Sparkles,
  BarChart3,
  Undo2,
  Redo2,
  Settings,
  User,
  ChevronDown,
  Upload,
  RefreshCw,
  Wand2,
  History,
  Users,
  BookTemplate,
  Type,
  Image,
  FileText,
  Palette,
  Zap,
  Check,
  X,
  Code,
  FileEdit
} from 'lucide-react';
import { Button } from '../ui/Button';

interface GlobalToolbarProps {
  onNew: () => void;
  onOpen: (file: File) => void;
  onSave: () => void;
  onExport: (format: 'pdf' | 'docx' | 'markdown' | 'html' | 'txt') => void;
  onEnhance: (level: 'quick' | 'pro' | 'premium') => void;
  onAnalyze: () => void;
  onRecompile?: () => void;
  onRandomStyle?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  userTier: string;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  mode?: 'document' | 'dev';
  onModeChange?: (mode: 'document' | 'dev') => void;
}

export function GlobalToolbar({
  onNew,
  onOpen,
  onSave,
  onExport,
  onEnhance,
  onAnalyze,
  onRecompile,
  onRandomStyle,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  userTier,
  saveStatus,
  mode = 'document',
  onModeChange,
}: GlobalToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showEnhanceMenu, setShowEnhanceMenu] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onOpen(file);
  };

  return (
    <div className="global-toolbar bg-slate-900 border-b border-slate-700 h-14 flex items-center justify-between px-4 z-50 sticky top-0 shadow-lg">
      {/* Left: Mode Switcher + File Operations */}
      <div className="flex items-center gap-4">
        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => onModeChange?.('document')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              mode === 'document'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
            title="Document Mode"
          >
            <FileEdit size={16} />
            <span className="text-sm font-medium">Documents</span>
          </button>
          <button
            onClick={() => onModeChange?.('dev')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
              mode === 'dev'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
            title="App Development Mode"
          >
            <Code size={16} />
            <span className="text-sm font-medium">Dev</span>
          </button>
        </div>

        <div className="w-px h-6 bg-slate-700" />

        {/* File Operations */}
        <button
          onClick={onNew}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-cyan-400"
          title="New Document (⌘N)"
        >
          <FilePlus size={18} />
        </button>

        <label
          htmlFor="file-upload"
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-cyan-400 cursor-pointer"
          title="Open File"
        >
          <FolderOpen size={18} />
          <input
            type="file"
            id="file-upload"
            onChange={handleFileInput}
            className="hidden"
            accept=".pdf,.docx,.doc,.txt,.md"
          />
        </label>

        <input
          type="file"
          id="file-upload-center"
          onChange={handleFileInput}
          className="hidden"
          accept=".pdf,.docx,.doc,.txt,.md"
        />

        <button
          onClick={onSave}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-cyan-400 relative"
          title="Save (⌘S)"
        >
          <Save size={18} />
          {saveStatus === 'saving' && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-cyan-400 flex items-center gap-1"
            title="Export"
          >
            <Download size={18} />
            <ChevronDown size={14} />
          </button>

          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-20">
                {(['pdf', 'docx', 'markdown', 'html', 'txt'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => {
                      onExport(format);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors text-sm"
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (⌘Z)"
        >
          <Undo2 size={18} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (⌘⇧Z)"
        >
          <Redo2 size={18} />
        </button>
      </div>

      {/* Center: Search + AI Actions */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search document..."
            className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 w-64 transition-colors"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowEnhanceMenu(!showEnhanceMenu)}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
          >
            <Sparkles size={16} />
            Enhance
            <ChevronDown size={14} />
          </button>

          {showEnhanceMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowEnhanceMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-20">
                <button
                  onClick={() => {
                    onEnhance('quick');
                    setShowEnhanceMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <div className="font-medium text-sm">Quick Polish</div>
                  <div className="text-xs text-slate-400">Basic improvements</div>
                </button>
                <button
                  onClick={() => {
                    onEnhance('pro');
                    setShowEnhanceMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <div className="font-medium text-sm flex items-center gap-2">
                    Pro Enhancement
                    <span className="text-xs px-1.5 py-0.5 bg-blue-600 rounded">Pro</span>
                  </div>
                  <div className="text-xs text-slate-400">Advanced rewrite</div>
                </button>
                <button
                  onClick={() => {
                    onEnhance('premium');
                    setShowEnhanceMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <div className="font-medium text-sm flex items-center gap-2">
                    Premium Polish
                    <span className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded">Premium</span>
                  </div>
                  <div className="text-xs text-slate-400">Complete transformation</div>
                </button>
              </div>
            </>
          )}
        </div>

        <label
          htmlFor="file-upload-center"
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm cursor-pointer"
          title="Upload Document"
        >
          <Upload size={16} />
          Upload
        </label>

        <button
          onClick={onAnalyze}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <BarChart3 size={16} />
          Analyze
        </button>

        {onRecompile && (
          <button
            onClick={onRecompile}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            title="Recompile LaTeX"
          >
            <RefreshCw size={16} />
            Recompile
          </button>
        )}

        {onRandomStyle && (
          <button
            onClick={onRandomStyle}
            className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
            title="Random Style Finish"
          >
            <Sparkles size={16} />
            Random Finish
          </button>
        )}

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* AI Commands Menu */}
        <div className="relative">
          <button
            onClick={() => setShowAIMenu(!showAIMenu)}
            className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
            title="AI Commands"
          >
            <Wand2 size={16} />
            AI Commands
            <ChevronDown size={14} />
          </button>

          {showAIMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowAIMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-20">
                <button className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Check size={14} className="text-green-400" />
                    Fix Grammar & Spelling
                  </div>
                </button>
                <button className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Zap size={14} className="text-yellow-400" />
                    Make More Concise
                  </div>
                </button>
                <button className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Type size={14} className="text-blue-400" />
                    Improve Tone
                  </div>
                </button>
                <button className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    Add Power Words
                  </div>
                </button>
                <button className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <X size={14} className="text-red-400" />
                    Remove Filler Words
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Template Gallery */}
        <button
          onClick={() => setShowTemplateGallery(!showTemplateGallery)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
          title="Template Gallery"
        >
          <BookTemplate size={16} />
          Templates
        </button>

        {/* Format Tools */}
        <div className="relative">
          <button
            onClick={() => setShowFormatMenu(!showFormatMenu)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
            title="Format Tools"
          >
            <Palette size={16} />
            Format
            <ChevronDown size={14} />
          </button>

          {showFormatMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFormatMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-20">
                <button className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors text-sm">
                  Add Header Image
                </button>
                <button className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors text-sm">
                  Insert Table
                </button>
                <button className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors text-sm">
                  Add Bullet Points
                </button>
                <button className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors text-sm">
                  Change Font
                </button>
                <button className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 transition-colors text-sm">
                  Adjust Margins
                </button>
              </div>
            </>
          )}
        </div>

        {/* Version History */}
        <button
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
          title="Version History"
        >
          <History size={16} />
          History
        </button>
      </div>

      {/* Right: User & Settings */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-cyan-400"
          title="Share & Collaborate"
        >
          <Users size={18} />
        </button>

        <button
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-cyan-400"
          title="Settings"
        >
          <Settings size={18} />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg">
          <User size={16} className="text-white" />
          <span className="text-sm text-white font-medium">{userTier}</span>
        </div>
      </div>
    </div>
  );
}
