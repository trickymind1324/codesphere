import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { problemApi } from '@/api/problem.api';
import { executionApi, TestResult } from '@/api/execution.api';
import { submissionApi } from '@/api/submission.api';
import { useAuthStore } from '@/stores/auth.store';
import { usePlaybackRecorder } from '@/hooks/usePlaybackRecorder';
import { SocraticTutorPanel } from '@/components/features/problems/SocraticTutorPanel';
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

export function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submissionId = searchParams.get('submissionId');
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'description' | 'submissions' | 'tutor'>('description');
  const [isRunning, setIsRunning] = useState(false);
  const [playbackSessionId] = useState(() => crypto.randomUUID());
  const [testResults, setTestResults] = useState<{
    status: string;
    passedTests: number;
    totalTests: number;
    results: TestResult[];
  } | null>(null);

  const { data: problem, isLoading, error } = useQuery({
    queryKey: ['problem', slug],
    queryFn: () => problemApi.getProblem(slug!),
    enabled: !!slug,
  });

  // Fetch submissions for this problem
  const { data: submissionsData } = useQuery({
    queryKey: ['problem-submissions', problem?.id],
    queryFn: () => submissionApi.getSubmissions({ problemId: problem!.id, pageSize: 50 }),
    enabled: !!problem?.id,
  });

  // Fetch specific submission if submissionId is provided
  const { data: loadedSubmission } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => submissionApi.getSubmission(submissionId!),
    enabled: !!submissionId,
  });

  // Record the coding session for Code Playback (best-effort telemetry).
  const recorder = usePlaybackRecorder({
    sessionId: playbackSessionId,
    problemId: problem?.id,
    language: selectedLanguage,
    enabled: !loadedSubmission,
  });

  const handleWatchReplay = async () => {
    await recorder.flush();
    window.open(`/playback/${playbackSessionId}`, '_blank');
  };

  // Load code when problem/submission data is available
  useEffect(() => {
    // If a submission is loaded, use its code and language
    if (loadedSubmission) {
      setCode(loadedSubmission.code);
      setSelectedLanguage(loadedSubmission.language);
    }
    // Otherwise, load starter code
    else if (problem && problem.starterCodes && problem.starterCodes.length > 0) {
      const starterCode = problem.starterCodes.find(
        (sc) => sc.language === selectedLanguage
      );
      if (starterCode) {
        setCode(starterCode.code);
      }
    }
  }, [problem, selectedLanguage, loadedSubmission]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    // If viewing a submission, don't change the code
    if (loadedSubmission) {
      return;
    }
    const starterCode = problem?.starterCodes.find((sc) => sc.language === language);
    if (starterCode) {
      setCode(starterCode.code);
    }
  };

  const handleClearSubmission = () => {
    setSearchParams({});
    // Reset to starter code
    const starterCode = problem?.starterCodes.find((sc) => sc.language === selectedLanguage);
    if (starterCode) {
      setCode(starterCode.code);
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    if (!problem) return;

    setIsRunning(true);
    setTestResults(null);
    recorder.mark('run');

    try {
      const response = await executionApi.testCode({
        language: selectedLanguage,
        code: code,
        problemId: problem.id,
      });

      setTestResults({
        status: response.status,
        passedTests: response.passedTests,
        totalTests: response.totalTests,
        results: response.results,
      });

      if (response.status === 'success') {
        toast.success(`All ${response.totalTests} tests passed!`);
      } else {
        toast.error(`${response.failedTests} of ${response.totalTests} tests failed`);
      }
    } catch (error: any) {
      console.error('Execution error:', error);
      toast.error(error.response?.data?.message || 'Failed to run code');

      // Still show test results if available in error response
      if (error.response?.data?.result) {
        const result = error.response.data.result;
        setTestResults({
          status: result.overallStatus === 'accepted' ? 'success' : 'failed',
          passedTests: result.passedTestCases || 0,
          totalTests: result.totalTestCases || 0,
          results: result.results || [],
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    if (!problem) return;

    setIsRunning(true);
    recorder.mark('submit');

    try {
      const response = await executionApi.submitCode({
        language: selectedLanguage,
        code: code,
        problemId: problem.id,
      });

      setTestResults({
        status: response.status,
        passedTests: response.passedTests,
        totalTests: response.totalTests,
        results: response.results,
      });

      // Invalidate cached submissions so the lists reflect the new row.
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['problem-submissions', problem.id] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentSubmissions'] });

      if (response.status === 'accepted') {
        toast.success('Submission accepted! All tests passed! 🎉');
      } else {
        toast.error(`Submission failed: ${response.status.replace(/_/g, ' ')}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit code');
      console.error('Submission error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 dark:text-green-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'hard':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading problem...</div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold">Problem not found</h2>
          <p className="mt-2 text-muted-foreground">
            The problem you're looking for doesn't exist.
          </p>
          <Link
            to="/problems"
            className="mt-4 inline-block text-primary hover:underline"
          >
            ← Back to problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <nav className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/problems" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">{problem.title}</h1>
          <span className={`text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
          </span>
        </div>
        <button
          onClick={logout}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Sign Out
        </button>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="w-1/2 overflow-y-auto border-r border-border bg-card">
          <div className="p-6">
            {/* Tabs */}
            <div className="mb-6 flex gap-4 border-b border-border">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-2 text-sm font-medium ${activeTab === 'description'
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`pb-2 text-sm font-medium ${activeTab === 'submissions'
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Submissions
              </button>
              <button
                onClick={() => setActiveTab('tutor')}
                className={`pb-2 text-sm font-medium ${activeTab === 'tutor'
                    ? 'border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                AI Tutor
              </button>
            </div>

            {activeTab === 'tutor' ? (
              <div className="h-[calc(100vh-180px)]">
                <SocraticTutorPanel
                  problemTitle={problem.title}
                  problemDescription={problem.description}
                  getCode={() => code}
                  language={selectedLanguage}
                />
              </div>
            ) : activeTab === 'description' ? (
              <>
                {/* Description */}
                <div className="prose prose-sm dark:prose-invert max-w-none markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: ({ inline, className, children, ...props }: any) => {
                        return inline ? (
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-primary" {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      strong: ({ children, ...props }: any) => (
                        <strong className="font-bold text-foreground" {...props}>{children}</strong>
                      ),
                      em: ({ children, ...props }: any) => (
                        <em className="italic" {...props}>{children}</em>
                      ),
                      ul: ({ children, ...props }: any) => (
                        <ul className="list-disc pl-6 space-y-1" {...props}>{children}</ul>
                      ),
                      li: ({ children, ...props }: any) => (
                        <li className="text-sm" {...props}>{children}</li>
                      ),
                    }}
                  >
                    {problem.description}
                  </ReactMarkdown>
                </div>

                {/* Examples */}
                {problem.examples && problem.examples.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-lg font-semibold">Examples</h3>
                    {problem.examples.map((example, idx) => (
                      <div key={idx} className="mb-4 rounded-lg bg-muted p-4">
                        <p className="font-semibold">Example {idx + 1}:</p>
                        <div className="mt-2 space-y-1 font-mono text-sm">
                          <div>
                            <span className="text-muted-foreground">Input:</span>{' '}
                            {example.input}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Output:</span>{' '}
                            {example.output}
                          </div>
                          {example.explanation && (
                            <div>
                              <span className="text-muted-foreground">Explanation:</span>{' '}
                              {example.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-lg font-semibold">Constraints</h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {problem.constraints.map((constraint, idx) => (
                        <li key={idx}>{constraint}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hints */}
                {problem.hints && problem.hints.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-lg font-semibold">Hints</h3>
                    <div className="space-y-2">
                      {problem.hints.map((hint, idx) => (
                        <details key={idx} className="rounded-lg bg-muted p-3">
                          <summary className="cursor-pointer font-medium">
                            Hint {idx + 1}
                          </summary>
                          <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Companies */}
                {problem.companies && problem.companies.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-lg font-semibold">
                      Companies that asked this
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {problem.companies.map((company, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1 text-sm"
                        >
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <h3 className="mb-4 text-lg font-semibold">Your Submissions</h3>
                {submissionsData && submissionsData.data.length > 0 ? (
                  <div className="space-y-3">
                    {submissionsData.data.map((submission) => (
                      <button
                        key={submission.id}
                        onClick={() => {
                          setSearchParams({ submissionId: submission.id });
                          setActiveTab('description');
                        }}
                        className={`w-full text-left rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                          submissionId === submission.id ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                submission.status === 'accepted'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            >
                              {submission.status === 'accepted' ? 'Accepted' : submission.status.replace(/_/g, ' ')}
                            </span>
                            <span className="rounded-md bg-muted px-2 py-1 text-xs font-mono">
                              {submission.language}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {submission.passedTestCases}/{submission.totalTestCases} passed
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(submission.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {submission.executionTimeMs && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Runtime: {submission.executionTimeMs}ms
                            {submission.memoryUsageKb && ` • Memory: ${(submission.memoryUsageKb / 1024).toFixed(2)}MB`}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-semibold">No submissions yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your submissions will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex w-1/2 flex-col">
          {/* Submission Notice Banner */}
          {loadedSubmission && (
            <div className="flex items-center justify-between border-b border-border bg-primary/10 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Viewing submission from {new Date(loadedSubmission.createdAt).toLocaleString()}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    loadedSubmission.status === 'accepted'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {loadedSubmission.status === 'accepted' ? 'Accepted' : loadedSubmission.status.replace(/_/g, ' ')}
                </span>
              </div>
              <button
                onClick={handleClearSubmission}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear & Reset to Starter Code
              </button>
            </div>
          )}

          {/* Editor Header */}
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={!!loadedSubmission}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {LANGUAGE_OPTIONS.filter((lang) =>
                problem.starterCodes.some((sc) => sc.language === lang.value)
              ).map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              {!loadedSubmission && (
                <button
                  onClick={handleWatchReplay}
                  title="Watch a replay of this coding session"
                  className="rounded-md border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Replay
                </button>
              )}
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium hover:bg-accent/80 disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isRunning}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isRunning ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className={testResults ? "h-[calc(100%-300px)]" : "flex-1"}>
            <Editor
              height="100%"
              language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={(editorInstance) => recorder.attach(editorInstance)}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>

          {/* Test Results Panel */}
          {testResults && (
            <div className="h-[300px] overflow-y-auto border-t border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Test Results</h3>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${testResults.status === 'success' || testResults.status === 'accepted'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                >
                  {testResults.passedTests} / {testResults.totalTests} passed
                </span>
              </div>

              <div className="space-y-3">
                {testResults.results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 ${result.passed
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                      }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">
                        Test Case {idx + 1}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${result.passed
                            ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                            : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                          }`}
                      >
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Input:</span>
                        <pre className="mt-1 rounded bg-muted p-2 font-mono text-xs">
                          {result.input}
                        </pre>
                      </div>

                      {!result.passed && (
                        <>
                          <div>
                            <span className="font-medium">Expected:</span>
                            <pre className="mt-1 rounded bg-muted p-2 font-mono text-xs">
                              {result.expectedOutput}
                            </pre>
                          </div>
                          <div>
                            <span className="font-medium">Your Output:</span>
                            <pre className="mt-1 rounded bg-muted p-2 font-mono text-xs">
                              {result.actualOutput}
                            </pre>
                          </div>
                        </>
                      )}

                      {result.error && (
                        <div>
                          <span className="font-medium text-red-600">Error:</span>
                          <pre className="mt-1 rounded bg-muted p-2 font-mono text-xs text-red-600">
                            {result.error}
                          </pre>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Execution time: {result.executionTime}ms
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
