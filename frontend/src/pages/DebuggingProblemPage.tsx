import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Editor, { type OnMount } from '@monaco-editor/react';
import type * as monacoNs from 'monaco-editor';
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

// Static editor options (identity-stable so the wrapper never re-applies them).
// readOnly is intentionally NOT here — it is per-file and applied imperatively
// via editor.updateOptions() on every file switch.
const EDITOR_OPTIONS: monacoNs.editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on',
};

/**
 * Multi-file editor architecture (the pattern Monaco itself is built around —
 * one editor instance, N text models):
 *
 * File contents live in Monaco models ONLY (modelsRef) — they are never
 * mirrored into React state, and the <Editor> is fully uncontrolled (no
 * `value`, `path` or `onChange` props). Switching files is an imperative
 * editor.setModel(); Run/Submit reads model.getValue() directly.
 *
 * Why not the wrapper's controlled `value`/`path` mode: with per-file
 * readOnly, @monaco-editor/react's value-sync effect takes a readOnly branch
 * that calls editor.setValue() unconditionally and WITHOUT its internal
 * prevent-trigger guard, while the onChange subscription is re-attached in a
 * later effect. On a file switch this fired the previous file's onChange
 * closure with the new file's content, silently cross-writing file contents
 * (main.py showing data_fetcher.py, etc.). Uncontrolled models make that
 * entire class of race impossible: each model's change listener closes over
 * its own file path.
 */
export function DebuggingProblemPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI file state. Contents are NOT here — they live in the Monaco models.
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());

  // Monaco handles (imperative world)
  const editorRef = useRef<monacoNs.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monacoNs | null>(null);
  const modelsRef = useRef<Map<string, monacoNs.editor.ITextModel>>(new Map());
  const listenersRef = useRef<monacoNs.IDisposable[]>([]);
  const originalsRef = useRef<Map<string, string>>(new Map());
  const readOnlyRef = useRef<Map<string, boolean>>(new Map());
  const viewStatesRef = useRef<Map<string, monacoNs.editor.ICodeEditorViewState | null>>(new Map());
  const prevActiveRef = useRef<string | null>(null);
  // Which problem+language the current models were built for; guards against
  // rebuilding (and wiping edits) when a background refetch returns new array
  // identity for the same data.
  const initKeyRef = useRef<string | null>(null);
  const [editorGen, setEditorGen] = useState(0);

  // Terminal state. The completion banner lives in its own footer so it always
  // renders after both stdout and stderr — otherwise a stderr warning (shown
  // below stdout) looks like it happened after "Run completed".
  const [terminalOutput, setTerminalOutput] = useState('');
  const [terminalError, setTerminalError] = useState('');
  const [terminalFooter, setTerminalFooter] = useState('');

  // WebSocket execution
  const { executeProject: wsExecuteProject, killExecution, connected: wsConnected } = useExecutionSocket();

  // Fetch problem data
  const { data: problem, isLoading: problemLoading } = useQuery({
    queryKey: ['problem', slug],
    queryFn: () => problemApi.getProblem(slug!),
    enabled: !!slug,
  });

  // Fetch problem files when problem and language are available. Previous data
  // is kept as placeholder during a language switch so the editor never
  // unmounts (unmounting would dispose the editor under our refs).
  const {
    data: problemFiles,
    isLoading: filesLoading,
    isFetching: filesFetching,
  } = useQuery({
    queryKey: ['problem-files', problem?.id, selectedLanguage],
    queryFn: () => problemApi.getProblemFiles(problem!.id, selectedLanguage),
    enabled: !!problem?.id && problem?.problemType === 'debugging',
    placeholderData: (prev) => prev,
  });

  const fileMeta = useMemo(
    () =>
      (problemFiles ?? []).map((f) => ({
        filePath: f.filePath,
        isReadOnly: !!f.isReadOnly,
        isEntryPoint: !!f.isEntryPoint,
      })),
    [problemFiles],
  );

  /** Dispose all models and their listeners; detach from the editor first. */
  const disposeAllModels = useCallback(() => {
    listenersRef.current.forEach((l) => l.dispose());
    listenersRef.current = [];
    try {
      editorRef.current?.setModel(null);
    } catch {
      // editor already disposed — models are independent, keep going
    }
    modelsRef.current.forEach((m) => {
      if (!m.isDisposed()) m.dispose();
    });
    modelsRef.current.clear();
    originalsRef.current.clear();
    readOnlyRef.current.clear();
    viewStatesRef.current.clear();
    prevActiveRef.current = null;
  }, []);

  /** Point the editor at a file's model and apply its readOnly flag. */
  const attachModel = useCallback((filePath: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = modelsRef.current.get(filePath);
    if (!model || model.isDisposed()) return;
    try {
      if (editor.getModel() !== model) {
        const prev = prevActiveRef.current;
        if (prev && editor.getModel()) {
          viewStatesRef.current.set(prev, editor.saveViewState());
        }
        editor.setModel(model);
        const viewState = viewStatesRef.current.get(filePath);
        if (viewState) editor.restoreViewState(viewState);
      }
      editor.updateOptions({ readOnly: readOnlyRef.current.get(filePath) ?? false });
      prevActiveRef.current = filePath;
    } catch {
      // editor disposed mid-flight (page teardown) — nothing to attach to
    }
  }, []);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // A fresh editor instance needs models (re)attached even for the same key.
    initKeyRef.current = null;
    setEditorGen((g) => g + 1);
  };

  // Build models whenever we have an editor + a fresh set of files for a
  // problem/language we haven't built yet.
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!editorRef.current || !monaco) return;
    if (!problem?.id || !problemFiles || problemFiles.length === 0) return;
    // While a language switch is in flight, problemFiles is placeholder (old
    // language) data — never build models from it.
    if (filesFetching) return;

    const key = `${problem.id}:${selectedLanguage}`;
    if (initKeyRef.current === key) return;
    initKeyRef.current = key;

    disposeAllModels();

    problemFiles.forEach((file) => {
      const uri = monaco.Uri.parse(
        `inmemory://codesphere/${encodeURIComponent(problem.id)}/${selectedLanguage}/${file.filePath}`,
      );
      // A model can linger under this URI (StrictMode remount, prior visit) —
      // always start a problem session from the seeded content.
      monaco.editor.getModel(uri)?.dispose();
      const model = monaco.editor.createModel(
        file.content,
        getLanguageFromFile(file.filePath),
        uri,
      );
      modelsRef.current.set(file.filePath, model);
      originalsRef.current.set(file.filePath, file.content);
      readOnlyRef.current.set(file.filePath, !!file.isReadOnly);

      // Per-model change listener, closed over ITS OWN path — a change in one
      // file can never be attributed to another, regardless of switch timing.
      listenersRef.current.push(
        model.onDidChangeContent(() => {
          const dirty = model.getValue() !== originalsRef.current.get(file.filePath);
          setModifiedFiles((prev) => {
            if (prev.has(file.filePath) === dirty) return prev;
            const next = new Set(prev);
            if (dirty) next.add(file.filePath);
            else next.delete(file.filePath);
            return next;
          });
        }),
      );
    });

    setModifiedFiles(new Set());

    // Open the entry point file or first file
    const entryFile = problemFiles.find((f) => f.isEntryPoint) || problemFiles[0];
    setOpenFiles([entryFile.filePath]);
    setActiveFile(entryFile.filePath);
    attachModel(entryFile.filePath);
  }, [editorGen, problem?.id, problemFiles, filesFetching, selectedLanguage, disposeAllModels, attachModel]);

  // Keep the editor pointed at the active file's model.
  useEffect(() => {
    if (activeFile) {
      attachModel(activeFile);
    } else {
      try {
        editorRef.current?.setModel(null);
      } catch {
        // editor gone — nothing to clear
      }
    }
  }, [activeFile, editorGen, attachModel]);

  // Dispose everything when leaving the page.
  useEffect(
    () => () => {
      disposeAllModels();
      initKeyRef.current = null;
    },
    [disposeAllModels],
  );

  // Handle file selection from tree/tabs
  const handleFileSelect = useCallback((filePath: string) => {
    setOpenFiles((prev) => (prev.includes(filePath) ? prev : [...prev, filePath]));
    setActiveFile(filePath);
  }, []);

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
    setTerminalFooter('');
    // Models for the new language are built by the effect once files arrive.
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
    if (modelsRef.current.size === 0) {
      toast.error('Files are still loading');
      return;
    }

    const banner = mode === 'submit'
      ? '═══ Submission started ═══\n'
      : '═══ Run started ═══\n';
    setTerminalOutput(banner);
    setTerminalError('');
    setTerminalFooter('');
    if (mode === 'submit') setIsSubmitting(true);
    setIsRunning(true);

    // The models are the single source of truth for file contents.
    const projectFiles = Array.from(modelsRef.current.entries()).map(
      ([filePath, model]) => ({
        filePath,
        content: model.getValue(),
      }),
    );

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
      setTerminalFooter(`═══ ${label} completed: ${status} ═══`);
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

  // Cmd+S / Ctrl+S — edits live in the editor models and are sent to the
  // runner on Run/Submit, so "save" is just a confirmation of the session.
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
    setTerminalFooter('');
  };

  // Full-page spinner only before the first file set ever arrives; language
  // switches keep the page (and the editor instance) mounted.
  const isLoading = problemLoading || (filesLoading && !problemFiles);
  const filesList = fileMeta.map((f) => ({
    filePath: f.filePath,
    content: '',
    isReadOnly: f.isReadOnly,
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

          {/* Monaco editor — uncontrolled; models are attached imperatively */}
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              theme="vs-dark"
              options={EDITOR_OPTIONS}
              onMount={handleEditorMount}
              keepCurrentModel
            />
            {!activeFile && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-500">
                Select a file from the tree to edit
              </div>
            )}
          </div>

          {/* Terminal */}
          <Terminal
            output={terminalOutput}
            error={terminalError}
            footer={terminalFooter}
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
