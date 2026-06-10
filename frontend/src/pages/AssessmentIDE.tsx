import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { assessmentApi, InvitationStatus } from '@/api/assessment.api';
import { problemApi } from '@/api/problem.api';
import { executionApi, TestResult } from '@/api/execution.api';
import { AssessmentTimer } from '@/components/features/assessment/AssessmentTimer';
import { useGlassBoxTracker } from '@/hooks/useGlassBoxTracker';
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

interface ProblemSubmission {
  problemId: string;
  submissionId?: string;
  code: string;
  language: string;
  status?: string;
}

export function AssessmentIDE() {
  const { token, index } = useParams<{ token: string; index: string }>();
  const navigate = useNavigate();
  const problemIndex = parseInt(index || '0', 10);

  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{
    status: string;
    passedTests: number;
    totalTests: number;
    results: TestResult[];
  } | null>(null);
  const [submissions, setSubmissions] = useState<Map<string, ProblemSubmission>>(new Map());
  const [hasWarned, setHasWarned] = useState(false);

  // Fetch assessment data
  const { data: validationData, isLoading } = useQuery({
    queryKey: ['validate-invitation', token],
    queryFn: () => assessmentApi.validateToken(token!),
    enabled: !!token,
    retry: false,
  });

  const assessment = validationData?.assessment;
  const invitation = validationData?.invitation;
  const currentProblemData = assessment?.assessmentProblems?.[problemIndex];
  const currentProblemId = currentProblemData?.problemId;

  // Glass Box analytics: capture paste/copy/tab-focus signals plus run and
  // submit markers while the assessment session is active.
  const glassBox = useGlassBoxTracker({
    invitationToken: token ?? '',
    enabled: !!token && invitation?.status === InvitationStatus.STARTED,
  });

  // Fetch current problem details
  const { data: problem } = useQuery({
    queryKey: ['problem', currentProblemId],
    queryFn: () => problemApi.getProblem(currentProblemId!),
    enabled: !!currentProblemId,
  });

  // Load starter code or saved code
  useEffect(() => {
    if (problem && currentProblemId) {
      const savedSubmission = submissions.get(currentProblemId);

      if (savedSubmission && savedSubmission.language === selectedLanguage) {
        setCode(savedSubmission.code);
      } else {
        const starterCode = problem.starterCodes?.find(
          (sc) => sc.language === selectedLanguage
        );
        if (starterCode) {
          setCode(starterCode.code);
        }
      }
    }
  }, [problem, selectedLanguage, currentProblemId, submissions]);

  // Auto-save code on change
  useEffect(() => {
    if (code && currentProblemId) {
      const timeoutId = setTimeout(() => {
        const updatedSubmissions = new Map(submissions);
        updatedSubmissions.set(currentProblemId, {
          problemId: currentProblemId,
          code,
          language: selectedLanguage,
          submissionId: updatedSubmissions.get(currentProblemId)?.submissionId,
          status: updatedSubmissions.get(currentProblemId)?.status,
        });
        setSubmissions(updatedSubmissions);

        // Save to localStorage as backup
        localStorage.setItem(
          `assessment_${token}_${currentProblemId}`,
          JSON.stringify({ code, language: selectedLanguage })
        );
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [code, selectedLanguage, currentProblemId, token, submissions]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const submissionArray = Array.from(submissions.values());
      const acceptedCount = submissionArray.filter(s => s.status === 'accepted').length;
      const totalPoints = assessment?.assessmentProblems.reduce((sum, p) => sum + p.points, 0) || 0;
      const earnedPoints = submissionArray.reduce((sum, s) => {
        const problemData = assessment?.assessmentProblems.find(p => p.problemId === s.problemId);
        return sum + (s.status === 'accepted' ? (problemData?.points || 0) : 0);
      }, 0);

      return assessmentApi.completeAssessment(token!, {
        score: earnedPoints,
        problemsSolved: acceptedCount,
        totalPoints,
      });
    },
    onSuccess: () => {
      // Clear localStorage
      assessment?.assessmentProblems.forEach(p => {
        localStorage.removeItem(`assessment_${token}_${p.problemId}`);
      });
      toast.success('Assessment submitted successfully!');
      navigate(`/assessment/${token}/completed`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit assessment');
    },
  });

  const handleTimeExpired = useCallback(() => {
    if (!completeMutation.isPending) {
      toast.error('Time is up! Auto-submitting your assessment...');
      setTimeout(() => {
        completeMutation.mutate();
      }, 2000);
    }
  }, [completeMutation]);

  const handleTimeWarning = useCallback(() => {
    if (!hasWarned) {
      setHasWarned(true);
      toast('⚠️ Only 5 minutes remaining!', {
        duration: 5000,
        icon: '⏰',
      });
    }
  }, [hasWarned]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    const starterCode = problem?.starterCodes.find((sc) => sc.language === language);
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
    glassBox.mark('execution', { language: selectedLanguage }, problem.id);

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
      toast.error(error.response?.data?.message || 'Failed to run code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }

    if (!problem || !currentProblemId) return;

    setIsRunning(true);
    glassBox.mark('submission', { language: selectedLanguage }, currentProblemId);

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

      // Update submissions map
      const updatedSubmissions = new Map(submissions);
      updatedSubmissions.set(currentProblemId, {
        problemId: currentProblemId,
        code,
        language: selectedLanguage,
        submissionId: response.submissionId,
        status: response.status,
      });
      setSubmissions(updatedSubmissions);

      if (response.status === 'accepted') {
        toast.success('Submission accepted! All tests passed! 🎉');
      } else {
        toast.error(`Submission failed: ${response.status.replace(/_/g, ' ')}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleNavigateProblem = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < (assessment?.assessmentProblems.length || 0)) {
      navigate(`/assessment/${token}/problem/${newIndex}`);
    }
  };

  const handleSubmitAssessment = () => {
    const solvedCount = Array.from(submissions.values()).filter(
      s => s.status === 'accepted'
    ).length;
    const totalProblems = assessment?.assessmentProblems.length || 0;

    const confirmed = window.confirm(
      `You have solved ${solvedCount} out of ${totalProblems} problems. Are you sure you want to submit your assessment?`
    );

    if (confirmed) {
      completeMutation.mutate();
    }
  };

  const handleExitAssessment = () => {
    const confirmed = window.confirm(
      'Are you sure you want to exit? Your progress will be saved, and you can resume later.'
    );

    if (confirmed) {
      navigate(`/assessment/${token}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!validationData?.valid || !assessment || !invitation) {
    navigate(`/assessment/${token}`);
    return null;
  }

  if (invitation.status === InvitationStatus.COMPLETED) {
    navigate(`/assessment/${token}`);
    return null;
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{assessment.title}</h2>
          <span className="text-sm text-muted-foreground">
            Problem {problemIndex + 1} of {assessment.assessmentProblems.length}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {invitation.startedAt && (
            <AssessmentTimer
              durationMinutes={assessment.durationMinutes}
              startedAt={invitation.startedAt}
              onTimeExpired={handleTimeExpired}
              onWarning={handleTimeWarning}
            />
          )}

          <button
            onClick={handleExitAssessment}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Exit Assessment
          </button>
        </div>
      </div>

      {/* Problem Navigation Tabs */}
      <div className="border-b border-border bg-card">
        <div className="flex gap-2 overflow-x-auto px-6 py-2">
          {assessment.assessmentProblems
            .sort((a, b) => a.order - b.order)
            .map((ap, idx) => {
              const submission = submissions.get(ap.problemId);
              const isActive = idx === problemIndex;

              return (
                <button
                  key={ap.problemId}
                  onClick={() => handleNavigateProblem(idx)}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : submission?.status === 'accepted'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  <span>{idx + 1}</span>
                  {submission?.status === 'accepted' && (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="w-1/2 overflow-y-auto border-r border-border bg-card p-6">
          {problem ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">{problem.title}</h1>
                <span className={`rounded px-2 py-1 text-xs font-semibold ${getDifficultyBadge(problem.difficulty)}`}>
                  {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                </span>
              </div>

              <div className="mb-4 text-sm text-muted-foreground">
                Points: {currentProblemData?.points}
              </div>

              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {problem.description}
              </ReactMarkdown>

              {problem.examples && problem.examples.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold">Examples</h3>
                  {problem.examples.map((example, idx) => (
                    <div key={idx} className="mt-4 rounded-md bg-muted p-4">
                      <p className="font-semibold">Example {idx + 1}:</p>
                      <pre className="mt-2 whitespace-pre-wrap">Input: {example.input}</pre>
                      <pre className="mt-1 whitespace-pre-wrap">Output: {example.output}</pre>
                      {example.explanation && (
                        <p className="mt-2 text-sm">Explanation: {example.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {problem.constraints && problem.constraints.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold">Constraints</h3>
                  <ul className="mt-2">
                    {problem.constraints.map((constraint, idx) => (
                      <li key={idx}>{constraint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex w-1/2 flex-col">
          {/* Editor Controls */}
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isRunning}
                className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="max-h-64 overflow-y-auto border-t border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">Test Results</h3>
                <span className={`text-sm ${testResults.status === 'success' || testResults.status === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
                  {testResults.passedTests} / {testResults.totalTests} passed
                </span>
              </div>
              <div className="space-y-2">
                {testResults.results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`rounded-md p-3 text-sm ${
                      result.passed
                        ? 'bg-green-50 dark:bg-green-950'
                        : 'bg-red-50 dark:bg-red-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Test Case {idx + 1}</span>
                      <span className={result.passed ? 'text-green-600' : 'text-red-600'}>
                        {result.passed ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>
                    {!result.passed && result.error && (
                      <p className="mt-2 text-red-700 dark:text-red-300">{result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => handleNavigateProblem(problemIndex - 1)}
              disabled={problemIndex === 0}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Previous
            </button>
            <button
              onClick={() => handleNavigateProblem(problemIndex + 1)}
              disabled={problemIndex === assessment.assessmentProblems.length - 1}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next →
            </button>
          </div>

          <button
            onClick={handleSubmitAssessment}
            disabled={completeMutation.isPending}
            className="rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {completeMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
}
