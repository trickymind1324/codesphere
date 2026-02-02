import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isModified?: boolean;
  isReadOnly?: boolean;
}

interface FileTreeProps {
  files: { filePath: string; content: string; isReadOnly?: boolean }[];
  activeFile: string | null;
  modifiedFiles: Set<string>;
  onFileSelect: (filePath: string) => void;
}

// Build tree structure from flat file list
function buildFileTree(files: { filePath: string; isReadOnly?: boolean }[]): FileNode[] {
  const root: FileNode[] = [];

  for (const file of files) {
    const parts = file.filePath.split('/');
    let current = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      let node = current.find(n => n.name === part);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          isReadOnly: isFile ? file.isReadOnly : undefined,
        };
        current.push(node);
      }

      if (!isFile && node.children) {
        current = node.children;
      }
    }
  }

  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    }).map(node => ({
      ...node,
      children: node.children ? sortNodes(node.children) : undefined,
    }));
  };

  return sortNodes(root);
}

// Get file icon color based on extension
function getFileColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'py': return 'text-yellow-500';
    case 'js': return 'text-yellow-400';
    case 'ts': case 'tsx': return 'text-blue-500';
    case 'java': return 'text-orange-500';
    case 'cpp': case 'c': case 'h': return 'text-blue-400';
    case 'go': return 'text-cyan-500';
    case 'json': return 'text-yellow-300';
    case 'md': return 'text-gray-400';
    case 'txt': return 'text-gray-400';
    default: return 'text-gray-400';
  }
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  activeFile: string | null;
  modifiedFiles: Set<string>;
  expandedFolders: Set<string>;
  onFileSelect: (filePath: string) => void;
  onToggleFolder: (path: string) => void;
}

function TreeNode({
  node,
  depth,
  activeFile,
  modifiedFiles,
  expandedFolders,
  onFileSelect,
  onToggleFolder,
}: TreeNodeProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isActive = activeFile === node.path;
  const isModified = modifiedFiles.has(node.path);

  const handleClick = () => {
    if (node.type === 'folder') {
      onToggleFolder(node.path);
    } else {
      onFileSelect(node.path);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-gray-700/50 rounded text-sm',
          isActive && 'bg-blue-600/30 text-blue-300'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" /> {/* Spacer for alignment */}
            <File className={cn('w-4 h-4 flex-shrink-0', getFileColor(node.name))} />
          </>
        )}
        <span className="truncate flex-1">{node.name}</span>
        {isModified && (
          <span className="text-yellow-500 text-xs ml-1" title="Modified">●</span>
        )}
        {node.isReadOnly && (
          <span className="text-gray-500 text-xs ml-1" title="Read-only">🔒</span>
        )}
      </div>

      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              modifiedFiles={modifiedFiles}
              expandedFolders={expandedFolders}
              onFileSelect={onFileSelect}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, activeFile, modifiedFiles, onFileSelect }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    // Expand all folders by default
    const folders = new Set<string>();
    files.forEach(file => {
      const parts = file.filePath.split('/');
      let path = '';
      for (let i = 0; i < parts.length - 1; i++) {
        path = path ? `${path}/${parts[i]}` : parts[i];
        folders.add(path);
      }
    });
    return folders;
  });

  const tree = useMemo(() => buildFileTree(files), [files]);

  const handleToggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="text-gray-300 py-2 select-none">
      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Files
      </div>
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          activeFile={activeFile}
          modifiedFiles={modifiedFiles}
          expandedFolders={expandedFolders}
          onFileSelect={onFileSelect}
          onToggleFolder={handleToggleFolder}
        />
      ))}
    </div>
  );
}
