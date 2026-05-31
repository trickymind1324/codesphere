import { useRef, useEffect } from 'react';
import { Trash2, Terminal as TerminalIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerminalProps {
  output: string;
  error?: string;
  isRunning?: boolean;
  isConnected?: boolean;
  onClear: () => void;
  className?: string;
}

export function Terminal({ output, error, isRunning, isConnected, onClear, className }: TerminalProps) {
  const outputRef = useRef<HTMLPreElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, error]);

  const hasOutput = output || error;

  return (
    <div className={cn('flex flex-col bg-gray-900 border-t border-gray-700', className)}>
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2 text-gray-300">
          <TerminalIcon className="w-4 h-4" />
          <span className="text-sm font-medium">Terminal</span>
          {isConnected !== undefined && (
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}
              title={isConnected ? 'WebSocket connected' : 'WebSocket disconnected'}
            />
          )}
          {isRunning && (
            <div className="flex items-center gap-1 text-blue-400 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Running...</span>
            </div>
          )}
        </div>
        <button
          onClick={onClear}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          title="Clear terminal"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Terminal output */}
      <pre
        ref={outputRef}
        className="flex-1 overflow-auto p-3 font-mono text-sm min-h-0"
      >
        {!hasOutput && !isRunning && (
          <span className="text-gray-500">
            Click "Run" to execute your code and see the output here.
          </span>
        )}
        {isRunning && !hasOutput && (
          <span className="text-gray-500">
            Executing code...
          </span>
        )}
        {output && (
          <span className="text-green-400 whitespace-pre-wrap">{output}</span>
        )}
        {error && (
          <>
            {output && '\n'}
            <span className="text-red-400 whitespace-pre-wrap">{error}</span>
          </>
        )}
      </pre>
    </div>
  );
}
