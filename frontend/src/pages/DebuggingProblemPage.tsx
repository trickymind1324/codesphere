import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  Play,
  Square,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { problemApi } from '@/api/problem.api';
import { executionApi, ExecuteProjectResponse } from '@/api/execution.api';
import { FileTree } from '@/components/debugging/FileTree';
import { FileTabs } from '@/components/debugging/FileTabs';
import { Terminal } from '@/components/debugging/Terminal';
import { useExecutionSocket } from '@/hooks/useExecutionSocket';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
];

// Infer Monaco language from file extension
function getLanguageFromFile(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    py: 'python',
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    go: 'go',
    json: 'json',
    md: 'markdown',
    txt: 'plaintext',
  };
  return map[ext || ''] || 'plaintext';
}

export function DebuggingProblemPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File management state
  const [files, setFiles] = useState<Map<string, { content: string; isReadOnly: boolean }>>(
    new Map()
  );
  const [originalFiles, setOriginalFiles] = useState<Map<string, string>>(new Map());
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());

  // Terminal state
  const [terminalOutput, setTerminalOutput] = useState('');
  const [terminalError, setTerminalError] = useState('');

  // WebSocket execution
  const { executeProject: wsExecuteProject, killExecution, connected: wsConnected } = useExecutionSocket();

  // Fetch problem data
  const { data: problem, isLoading: problemLoading } = useQuery({
    queryKey: ['problem', slug],
    queryFn: () => problemApi.getProblem(slug!),
    enabled: !!slug,
  });

  // Fetch problem files when problem and language are available
  const { data: problemFiles, isLoading: filesLoading } = useQuery({
    queryKey: ['problem-files', problem?.id, selectedLanguage],
    queryFn: () => problemApi.getProblemFiles(problem!.id, selectedLanguage),
    enabled: !!problem?.id && problem?.problemType === 'debugging',
  });

  // Initialize files when problem files are loaded
  useEffect(() => {
    if (problemFiles && problemFiles.length > 0) {
      const newFiles = new Map<string, { content: string; isReadOnly: boolean }>();
      const newOriginal = new Map<string, string>();

      problemFiles.forEach((file) => {
        newFiles.set(file.filePath, {
          content: file.content,
          isReadOnly: file.isReadOnly,
        });
        newOriginal.set(file.filePath, file.content);
      });

      setFiles(newFiles);
      setOriginalFiles(newOriginal);
      setModifiedFiles(new Set());

      // Open the entry point file or first file
      const entryFile = problemFiles.find((f) => f.isEntryPoint);
      const firstFile = entryFile || problemFiles[0];
      if (firstFile) {
        setOpenFiles([firstFile.filePath]);
        setActiveFile(firstFile.filePath);
      }
    }
  }, [problemFiles]);

  // Handle file selection from tree
  const handleFileSelect = useCallback((filePath: string) => {
    if (!openFiles.includes(filePath)) {
      setOpenFiles((prev) => [...prev, filePath]);
    }
    setActiveFile(filePath);
  }, [openFiles]);

  // Handle closing a file tab
  const handleCloseFile = useCallback((filePath: string) => {
    setOpenFiles((prev) => {
      const newOpen = prev.filter((f) => f !== filePath);
      if (activeFile === filePath) {
        // Select previous file or next file or null
        const idx = prev.indexOf(filePath);
        setActiveFile(newOpen[idx - 1] || newOpen[idx] || null);
      }
      return newOpen;
    });
  }, [activeFile]);

  // Handle code changes
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (!activeFile || value === undefined) return;

    setFiles((prev) => {
      const newFiles = new Map(prev);
      const fileData = newFiles.get(activeFile);
      if (fileData) {
        newFiles.set(activeFile, { ...fileData, content: value });
      }
      return newFiles;
    });

    // Check if file is modified
    const original = originalFiles.get(activeFile);
    setModifiedFiles((prev) => {
      const newSet = new Set(prev);
      if (value !== original) {
        newSet.add(activeFile);
      } else {
        newSet.delete(activeFile);
      }
      return newSet;
    });
  }, [activeFile, originalFiles]);

  // Handle language change
  const handleLanguageChange = (language: string) => {
    if (modifiedFiles.size > 0) {
      if (!confirm('Changing language will discard unsaved changes. Continue?')) {
        return;
      }
    }
    setSelectedLanguage(language);
    setOpenFiles([]);
    setActiveFile(null);
    setModifiedFiles(new Set());
    setTerminalOutput('');
    setTerminalError('');
  };

  // Shared run/submit core. Mode controls banner text and which toasts fire
  // on completion. Backend has no multi-file "submit-with-test-validation"
  // endpoint yet, so submit currently executes the project the same way Run
  // does — the visible difference is the banner and the success message.
  const executeProject = async (mode: 'run' | 'submit') => {
    if (!problem?.executionConfig?.entryCommand) {
      toast.error('No entry command configured for this problem');
      return;
    }

    const banner = mode === 'submit'
      ? '═══ Submission started ═══\n'
      : '═══ Run started ═══\n';
    setTerminalOutput(banner);
    setTerminalError('');
    if (mode === 'submit') setIsSubmitting(true);
    setIsRunning(true);

    const projectFiles = Array.from(files.entries()).map(([filePath, data]) => ({
      filePath,
      content: data.content,
    }));

    const finishToast = (status: string) => {
      const label = mode === 'submit' ? 'Submission' : 'Run';
      if (status === 'success') toast.success(`${label} succeeded`);
      else if (status === 'time_limit_exceeded' || status === 'timeout')
        toast.error(`${label} hit the time limit`);
      else if (status === 'runtime_error') toast.error(`${label} had a runtime error`);
      else if (status === 'compile_error') toast.error(`${label} failed to compile`);
      else toast.error(`${label} failed: ${status}`);
    };

    const appendFooter = (status: string) => {
      const label = mode === 'submit' ? 'Submission' : 'Run';
      setTerminalOutput((prev) => `${prev}\n═══ ${label} completed: ${status} ═══\n`);
    };

    if (wsConnected) {
      wsExecuteProject(
        {
          files: projectFiles,
          language: selectedLanguage,
          entryCommand: problem.executionConfig.entryCommand,
          problemId: problem.id,
        },
        {
          onOutput: (stream, data) => {
            if (stream === 'stdout') setTerminalOutput((prev) => prev + data);
            else setTerminalError((prev) => prev + data);
          },
          onCompleted: (result) => {
            setIsRunning(false);
            if (mode === 'submit') setIsSubmitting(false);
            if (result.error) {
              setTerminalError((prev) =>
                prev ? prev + '\n' + result.error : result.error!,
              );
            }
            appendFooter(result.status);
            finishToast(result.status);
          },
          onError: (message) => {
            setIsRunning(false);
            if (mode === 'submit') setIsSubmitting(false);
            setTerminalError(message);
            appendFooter('error');
            toast.error(`${mode === 'submit' ? 'Submission' : 'Run'} failed`);
          },
        },
      );
      return;
    }

    // HTTP fallback
    try {
      const response: ExecuteProjectResponse = await executionApi.executeProject({
        files: projectFiles,
        language: selectedLanguage,
        entryCommand: problem.executionConfig.entryCommand,
        problemId: problem.id,
      });
      if (response.stdout) setTerminalOutput((prev) => prev + response.stdout);
      if (response.stderr || response.error) {
        setTerminalError(response.stderr || response.error || '');
      }
      appendFooter(response.status);
      finishToast(response.status);
    } catch (error: any) {
      setTerminalError(error.message || 'Failed to execute code');
      appendFooter('error');
      toast.error(`${mode === 'submit' ? 'Submission' : 'Run'} failed`);
    } finally {
      setIsRunning(false);
      if (mode === 'submit') setIsSubmitting(false);
    }
  };

  const handleRun = () => executeProject('run');
  const handleSubmit = () => executeProject('submit');

  // Cmd+S / Ctrl+S — edits live in React state and are sent to the runner
  // on Run/Submit, so "save" is just a confirmation of the in-session model.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const dirty = modifiedFiles.size;
        toast.success(
          dirty
            ? `Saved to session (${dirty} file${dirty > 1 ? 's' : ''} modified)`
            : 'Saved to session — no unsaved changes',
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modifiedFiles.size]);

  // Clear terminal
  const handleClearTerminal = () => {
    setTerminalOutput('');
    setTerminalError('');
  };

  const isLoading = problemLoading || filesLoading;
  const currentFile = activeFile ? files.get(activeFile) : null;
  const filesList = Array.from(files.entries()).map(([filePath, data]) => ({
    filePath,
    content: data.content,
    isReadOnly: data.isReadOnly,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Problem not found</h2>
          <Link to="/problems" className="text-blue-400 hover:underline">
            Back to problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Link
            to="/problems"
            className="flex items-center gap-1 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-semibold truncate max-w-md">{problem.title}</h1>
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-medium rounded',
                problem.difficulty === 'easy' && 'bg-green-600/20 text-green-400',
                problem.difficulty === 'medium' && 'bg-yellow-600/20 text-yellow-400',
                problem.difficulty === 'hard' && 'bg-red-600/20 text-red-400'
              )}
            >
              {problem.difficulty}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-600/20 text-purple-400">
              Debugging
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          {/* Run / Stop buttons */}
          {isRunning ? (
            <button
              onClick={killExecution}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium"
            >
              <Play className="w-4 h-4" />
              Run
            </button>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left sidebar */}
        <div className="w-64 flex flex-col bg-gray-850 border-r border-gray-700">
          {/* File tree */}
          <div className="flex-1 overflow-auto">
            <FileTree
              files={filesList}
              activeFile={activeFile}
              modifiedFiles={modifiedFiles}
              onFileSelect={handleFileSelect}
            />
          </div>

          {/* Problem description (collapsible) */}
          <div className="border-t border-gray-700">
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700"
            >
              <span>Problem Description</span>
              {isDescriptionExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
            {isDescriptionExpanded && (
              <div className="max-h-64 overflow-auto p-3 text-sm prose prose-invert prose-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {problem.description}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Editor and terminal area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* File tabs */}
          <div className="flex items-center justify-between bg-gray-800 border-b border-gray-700">
            <div className="flex-1 min-w-0">
              <FileTabs
                openFiles={openFiles}
                activeFile={activeFile}
                modifiedFiles={modifiedFiles}
                onSelectFile={handleFileSelect}
                onCloseFile={handleCloseFile}
              />
            </div>
            <div
              className="px-3 text-xs text-gray-400 whitespace-nowrap"
              title="Edits live in your session and are sent to the runner on Run/Submit. Cmd/Ctrl+S to confirm."
            >
              {modifiedFiles.size > 0
                ? `● ${modifiedFiles.size} unsaved`
                : 'Auto-saved'}
            </div>
          </div>

          {/* Monaco editor */}
          <div className="flex-1 min-h-0">
            {activeFile && currentFile ? (
              <Editor
                height="100%"
                language={getLanguageFromFile(activeFile)}
                value={currentFile.content}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  readOnly: currentFile.isReadOnly,
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a file from the tree to edit
              </div>
            )}
          </div>

          {/* Terminal */}
          <Terminal
            output={terminalOutput}
            error={terminalError}
            isRunning={isRunning}
            isConnected={wsConnected}
            onClear={handleClearTerminal}
            className="h-48"
          />
        </div>
      </div>
    </div>
  );
}
