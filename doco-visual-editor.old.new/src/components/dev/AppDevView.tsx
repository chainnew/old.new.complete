import { useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { FileExplorer } from './FileExplorer';
import { Terminal } from './Terminal';
import { X } from 'lucide-react';

interface OpenFile {
  path: string;
  name: string;
  content: string;
  language: string;
}

export function AppDevView() {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([
    {
      path: '/src/App.tsx',
      name: 'App.tsx',
      language: 'typescript',
      content: `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Welcome to Doco App Development</h1>
      <p>Start building your full-stack application!</p>
    </div>
  );
}

export default App;
`,
    },
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  const handleFileSelect = (path: string) => {
    // Check if file is already open
    const existingIndex = openFiles.findIndex((f) => f.path === path);
    if (existingIndex !== -1) {
      setActiveFileIndex(existingIndex);
      return;
    }

    // Mock file content (in real implementation, would fetch from backend/fs)
    const fileName = path.split('/').pop() || 'untitled';
    const extension = fileName.split('.').pop() || '';
    const languageMap: Record<string, string> = {
      tsx: 'typescript',
      ts: 'typescript',
      jsx: 'javascript',
      js: 'javascript',
      json: 'json',
      css: 'css',
      html: 'html',
      md: 'markdown',
    };

    const newFile: OpenFile = {
      path,
      name: fileName,
      content: `// File: ${path}\n// Add your code here...`,
      language: languageMap[extension] || 'plaintext',
    };

    setOpenFiles([...openFiles, newFile]);
    setActiveFileIndex(openFiles.length);
  };

  const handleCloseFile = (index: number) => {
    const newFiles = openFiles.filter((_, i) => i !== index);
    setOpenFiles(newFiles);
    if (activeFileIndex >= newFiles.length) {
      setActiveFileIndex(Math.max(0, newFiles.length - 1));
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    const newFiles = [...openFiles];
    newFiles[activeFileIndex].content = value;
    setOpenFiles(newFiles);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <PanelGroup direction="horizontal">
        {/* File Explorer - Left */}
        <Panel defaultSize={20} minSize={15} maxSize={30}>
          <FileExplorer onFileSelect={handleFileSelect} />
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-700 hover:bg-blue-500 transition-colors" />

        {/* Code Editor - Center */}
        <Panel defaultSize={55} minSize={40}>
          <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className="flex bg-slate-800 border-b border-slate-700 overflow-x-auto">
              {openFiles.map((file, index) => (
                <div
                  key={file.path}
                  className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-slate-700 min-w-fit group ${
                    index === activeFileIndex
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-slate-200'
                  }`}
                  onClick={() => setActiveFileIndex(index)}
                >
                  <span className="text-sm">{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseFile(index);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-slate-600 rounded p-0.5 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Monaco Editor */}
            <div className="flex-1">
              {openFiles.length > 0 && (
                <Editor
                  height="100%"
                  language={openFiles[activeFileIndex]?.language || 'typescript'}
                  value={openFiles[activeFileIndex]?.content || ''}
                  onChange={handleEditorChange}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    fontFamily:
                      '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
                    fontLigatures: true,
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    renderWhitespace: 'selection',
                    bracketPairColorization: { enabled: true },
                    guides: {
                      bracketPairs: true,
                      indentation: true,
                    },
                  }}
                />
              )}
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-700 hover:bg-blue-500 transition-colors" />

        {/* Terminal - Bottom Right */}
        <Panel defaultSize={25} minSize={20}>
          <div className="h-full flex flex-col">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
              <h3 className="text-slate-200 font-semibold text-sm">Terminal</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <Terminal />
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
