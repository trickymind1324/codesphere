import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { assessmentApi, CreateAssessmentDto, AssessmentStatus, AssessmentProblem } from '@/api/assessment.api';
import { problemApi, Problem } from '@/api/problem.api';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

interface SelectedProblem extends Problem {
  order: number;
  points: number;
}

export function AssessmentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, logout } = useAuthStore();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    durationMinutes: 120,
  });

  const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>([]);
  const [showProblemSelector, setShowProblemSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');

  // Fetch existing assessment if editing
  const { data: existingAssessment, isLoading: isLoadingAssessment } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => assessmentApi.getAssessment(id!),
    enabled: isEditMode,
  });

  // Load existing data when editing
  useEffect(() => {
    if (existingAssessment) {
      setFormData({
        title: existingAssessment.title,
        description: existingAssessment.description || '',
        durationMinutes: existingAssessment.durationMinutes,
      });

      // Convert assessment problems to selected problems
      const problems: SelectedProblem[] = existingAssessment.assessmentProblems.map((ap) => ({
        ...(ap.problem as Problem),
        order: ap.order,
        points: ap.points,
      }));
      setSelectedProblems(problems.sort((a, b) => a.order - b.order));
    }
  }, [existingAssessment]);

  // Fetch all problems for selection
  const { data: problemsData, isLoading: isLoadingProblems } = useQuery({
    queryKey: ['problems', { search: searchQuery, difficulty: difficultyFilter, pageSize: 100 }],
    queryFn: () => problemApi.getProblems({
      search: searchQuery,
      difficulty: difficultyFilter || undefined,
      pageSize: 100,
    }),
    enabled: showProblemSelector,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAssessmentDto & { status: AssessmentStatus }) => {
      const { status, ...assessmentData } = data;
      return assessmentApi.createAssessment(assessmentData).then(async (assessment) => {
        if (status === AssessmentStatus.PUBLISHED) {
          await assessmentApi.updateStatus(assessment.id, AssessmentStatus.PUBLISHED);
        }
        return assessment;
      });
    },
    onSuccess: () => {
      toast.success('Assessment created successfully');
      navigate('/recruiter/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create assessment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; durationMinutes: number }) =>
      assessmentApi.updateAssessment(id!, data),
    onSuccess: () => {
      toast.success('Assessment updated successfully');
      navigate('/recruiter/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update assessment');
    },
  });

  const handleSubmit = (status: AssessmentStatus) => {
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter assessment title');
      return;
    }

    if (selectedProblems.length === 0) {
      toast.error('Please select at least one problem');
      return;
    }

    if (formData.durationMinutes < 10) {
      toast.error('Duration must be at least 10 minutes');
      return;
    }

    const problems = selectedProblems.map((p) => ({
      problemId: p.id,
      order: p.order,
      points: p.points,
    }));

    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate({
        ...formData,
        problems,
        status,
      });
    }
  };

  const handleAddProblem = (problem: Problem) => {
    if (selectedProblems.find((p) => p.id === problem.id)) {
      toast.error('Problem already added');
      return;
    }

    const newProblem: SelectedProblem = {
      ...problem,
      order: selectedProblems.length + 1,
      points: problem.difficulty === 'easy' ? 10 : problem.difficulty === 'medium' ? 20 : 30,
    };

    setSelectedProblems([...selectedProblems, newProblem]);
    toast.success(`Added "${problem.title}"`);
  };

  const handleRemoveProblem = (problemId: string) => {
    const updated = selectedProblems
      .filter((p) => p.id !== problemId)
      .map((p, index) => ({ ...p, order: index + 1 }));
    setSelectedProblems(updated);
  };

  const handleMoveProblem = (problemId: string, direction: 'up' | 'down') => {
    const index = selectedProblems.findIndex((p) => p.id === problemId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedProblems.length - 1)
    ) {
      return;
    }

    const newProblems = [...selectedProblems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newProblems[index], newProblems[targetIndex]] = [newProblems[targetIndex], newProblems[index]];

    // Update order numbers
    const reordered = newProblems.map((p, i) => ({ ...p, order: i + 1 }));
    setSelectedProblems(reordered);
  };

  const handleUpdatePoints = (problemId: string, points: number) => {
    if (points < 1) return;
    setSelectedProblems(
      selectedProblems.map((p) => (p.id === problemId ? { ...p, points } : p))
    );
  };

  const getDifficultyColor = (difficulty: string) => {
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

  if (isEditMode && isLoadingAssessment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold">
              CodeSphere
            </Link>
            <div className="flex gap-4">
              <Link
                to="/recruiter/dashboard"
                className="text-sm font-medium text-primary"
              >
                Dashboard
              </Link>
              <Link
                to="/problems"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Problems
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email} ({user?.role})
            </span>
            <button
              onClick={logout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEditMode ? 'Edit Assessment' : 'Create Assessment'}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isEditMode
                  ? 'Update assessment details and problems'
                  : 'Set up a new assessment with problems and duration'}
              </p>
            </div>
            <button
              onClick={() => navigate('/recruiter/dashboard')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Basic Information */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <div className="mt-6 space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-foreground">
                    Assessment Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior Backend Engineer Assessment"
                    className="mt-2 w-full rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the purpose and expectations for this assessment..."
                    rows={4}
                    className="mt-2 w-full rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-foreground">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    id="duration"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })
                    }
                    min={10}
                    max={300}
                    className="mt-2 w-full rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recommended: 60-120 minutes. This is the total time candidates have to complete all
                    problems.
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Problems */}
            <div className="mt-8 rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Selected Problems ({selectedProblems.length})
                </h2>
                <button
                  onClick={() => setShowProblemSelector(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Problems
                </button>
              </div>

              {selectedProblems.length === 0 ? (
                <div className="mt-6 rounded-lg border-2 border-dashed border-border p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-4 text-sm font-medium">No problems added</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click "Add Problems" to select coding challenges for this assessment.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {selectedProblems.map((problem, index) => (
                    <div
                      key={problem.id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-background p-4"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveProblem(problem.id, 'up')}
                          disabled={index === 0}
                          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveProblem(problem.id, 'down')}
                          disabled={index === selectedProblems.length - 1}
                          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">#{problem.order}</span>
                          <h3 className="font-medium">{problem.title}</h3>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getDifficultyColor(
                              problem.difficulty
                            )}`}
                          >
                            {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={problem.points}
                          onChange={(e) =>
                            handleUpdatePoints(problem.id, parseInt(e.target.value) || 1)
                          }
                          min={1}
                          max={100}
                          className="w-20 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground">pts</span>
                      </div>

                      <button
                        onClick={() => handleRemoveProblem(problem.id)}
                        className="rounded p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Assessment Summary</h2>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Problems:</span>
                  <span className="font-medium">{selectedProblems.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Points:</span>
                  <span className="font-medium">
                    {selectedProblems.reduce((sum, p) => sum + p.points, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{formData.durationMinutes} min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Time/Problem:</span>
                  <span className="font-medium">
                    {selectedProblems.length > 0
                      ? Math.round(formData.durationMinutes / selectedProblems.length)
                      : 0}{' '}
                    min
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  onClick={() => handleSubmit(AssessmentStatus.DRAFT)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSubmit(AssessmentStatus.PUBLISHED)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : isEditMode
                    ? 'Update Assessment'
                    : 'Create & Publish'}
                </button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {isEditMode
                  ? 'Changes will be saved immediately.'
                  : 'Published assessments can be used to invite candidates. Drafts can be edited later.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Selector Modal */}
      {showProblemSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border bg-muted/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Select Problems</h2>
                <button
                  onClick={() => setShowProblemSelector(false)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-4 flex gap-4">
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
              {isLoadingProblems ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {problemsData?.data.map((problem) => (
                    <div
                      key={problem.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-background p-4 hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{problem.title}</h3>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getDifficultyColor(
                              problem.difficulty
                            )}`}
                          >
                            {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Acceptance: {problem.acceptanceRate ? Number(problem.acceptanceRate).toFixed(1) : '0.0'}%
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddProblem(problem)}
                        disabled={selectedProblems.some((p) => p.id === problem.id)}
                        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {selectedProblems.some((p) => p.id === problem.id) ? 'Added' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
