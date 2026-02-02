import { X, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTabsProps {
  openFiles: string[];
  activeFile: string | null;
  modifiedFiles: Set<string>;
  onSelectFile: (filePath: string) => void;
  onCloseFile: (filePath: string) => void;
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
    default: return 'text-gray-400';
  }
}

// Get just the filename from a path
function getFileName(filePath: string): string {
  return filePath.split('/').pop() || filePath;
}

export function FileTabs({
  openFiles,
  activeFile,
  modifiedFiles,
  onSelectFile,
  onCloseFile,
}: FileTabsProps) {
  if (openFiles.length === 0) {
    return (
      <div className="h-9 bg-gray-900 border-b border-gray-700 flex items-center px-4 text-gray-500 text-sm">
        No files open
      </div>
    );
  }

  return (
    <div className="h-9 bg-gray-900 border-b border-gray-700 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
      {openFiles.map((filePath) => {
        const isActive = activeFile === filePath;
        const isModified = modifiedFiles.has(filePath);
        const fileName = getFileName(filePath);

        return (
          <div
            key={filePath}
            className={cn(
              'flex items-center gap-1.5 px-3 h-full border-r border-gray-700 cursor-pointer group min-w-0',
              isActive
                ? 'bg-gray-800 text-white'
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800/50'
            )}
            onClick={() => onSelectFile(filePath)}
          >
            <File className={cn('w-3.5 h-3.5 flex-shrink-0', getFileColor(fileName))} />
            <span className="text-sm truncate max-w-32" title={filePath}>
              {fileName}
            </span>
            {isModified && (
              <span className="text-yellow-500 text-xs flex-shrink-0" title="Modified">
                ●
              </span>
            )}
            <button
              className={cn(
                'p-0.5 rounded hover:bg-gray-600 ml-1 flex-shrink-0',
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onCloseFile(filePath);
              }}
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
