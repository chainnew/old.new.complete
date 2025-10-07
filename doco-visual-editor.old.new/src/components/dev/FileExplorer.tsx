import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  extension?: string;
}

// Mock file structure
const mockFileStructure: FileNode[] = [
  {
    name: 'src',
    type: 'folder',
    path: '/src',
    children: [
      {
        name: 'components',
        type: 'folder',
        path: '/src/components',
        children: [
          { name: 'App.tsx', type: 'file', path: '/src/components/App.tsx', extension: 'tsx' },
          { name: 'Header.tsx', type: 'file', path: '/src/components/Header.tsx', extension: 'tsx' },
        ],
      },
      { name: 'index.tsx', type: 'file', path: '/src/index.tsx', extension: 'tsx' },
      { name: 'App.css', type: 'file', path: '/src/App.css', extension: 'css' },
    ],
  },
  {
    name: 'public',
    type: 'folder',
    path: '/public',
    children: [
      { name: 'index.html', type: 'file', path: '/public/index.html', extension: 'html' },
      { name: 'favicon.ico', type: 'file', path: '/public/favicon.ico', extension: 'ico' },
    ],
  },
  { name: 'package.json', type: 'file', path: '/package.json', extension: 'json' },
  { name: 'tsconfig.json', type: 'file', path: '/tsconfig.json', extension: 'json' },
  { name: 'README.md', type: 'file', path: '/README.md', extension: 'md' },
];

interface FileTreeItemProps {
  node: FileNode;
  level: number;
  onFileClick: (path: string) => void;
}

function FileTreeItem({ node, level, onFileClick }: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const getFileIcon = (extension?: string) => {
    if (!extension) return <File size={16} className="text-slate-400" />;

    const iconMap: Record<string, JSX.Element> = {
      tsx: <FileCode size={16} className="text-blue-400" />,
      ts: <FileCode size={16} className="text-blue-400" />,
      jsx: <FileCode size={16} className="text-cyan-400" />,
      js: <FileCode size={16} className="text-yellow-400" />,
      json: <FileJson size={16} className="text-yellow-400" />,
      md: <FileText size={16} className="text-slate-400" />,
      html: <FileCode size={16} className="text-orange-400" />,
      css: <FileCode size={16} className="text-purple-400" />,
    };

    return iconMap[extension] || <File size={16} className="text-slate-400" />;
  };

  if (node.type === 'file') {
    return (
      <div
        className="flex items-center gap-2 px-2 py-1 hover:bg-slate-700 cursor-pointer rounded group"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onFileClick(node.path)}
      >
        {getFileIcon(node.extension)}
        <span className="text-sm text-slate-200 group-hover:text-white">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1 hover:bg-slate-700 cursor-pointer rounded group"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
        {isExpanded ? (
          <FolderOpen size={16} className="text-blue-400" />
        ) : (
          <Folder size={16} className="text-blue-400" />
        )}
        <span className="text-sm text-slate-200 font-medium group-hover:text-white">
          {node.name}
        </span>
      </div>
      {isExpanded && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <FileTreeItem
              key={`${child.path}-${idx}`}
              node={child}
              level={level + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileExplorerProps {
  onFileSelect?: (path: string) => void;
}

export function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const handleFileClick = (path: string) => {
    console.log('File clicked:', path);
    onFileSelect?.(path);
  };

  return (
    <div className="h-full bg-slate-900 overflow-y-auto">
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-slate-200 font-semibold text-sm uppercase tracking-wide">
          Explorer
        </h3>
      </div>
      <div className="py-2">
        {mockFileStructure.map((node, idx) => (
          <FileTreeItem
            key={`${node.path}-${idx}`}
            node={node}
            level={0}
            onFileClick={handleFileClick}
          />
        ))}
      </div>
    </div>
  );
}
