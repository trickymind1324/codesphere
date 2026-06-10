import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assessmentApi, AssessmentStatus } from '@/api/assessment.api';
import { formatDistanceToNow } from 'date-fns';

export function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: assessment, isLoading, error } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => assessmentApi.getAssessment(id!),
    enabled: !!id,
  });

  const { data: statistics } = useQuery({
    queryKey: ['assessment-statistics', id],
    queryFn: () => assessmentApi.getStatistics(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-100">
            Assessment Not Found
          </h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            The assessment you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => navigate('/recruiter/dashboard')}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.PUBLISHED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case AssessmentStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case AssessmentStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatStatus = (status: AssessmentStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/recruiter/dashboard')}
                className="rounded-md p-2 hover:bg-muted"
                title="Back to Dashboard"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{assessment.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Created {formatDistanceToNow(new Date(assessment.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(assessment.status)}`}>
                {formatStatus(assessment.status)}
              </span>
              <button
                onClick={() => navigate(`/recruiter/assessments/${assessment.id}/edit`)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Edit Assessment
              </button>
              {assessment.status === AssessmentStatus.PUBLISHED && (
                <button
                  onClick={() => navigate(`/recruiter/assessments/${assessment.id}/invite`)}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Send Invitations
                </button>
              )}
              {assessment.invitationsCount > 0 && (
                <button
                  onClick={() => navigate(`/recruiter/assessments/${assessment.id}/results`)}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  View Results
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Overview */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{assessment.durationMinutes} min</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Problems</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{assessment.assessmentProblems.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {assessment.assessmentProblems.reduce((sum, ap) => sum + ap.points, 0)}
                </p>
              </div>
            </div>
            {assessment.description && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-2 text-foreground">{assessment.description}</p>
              </div>
            )}
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invitations</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{statistics.totalInvitations || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{statistics.completedCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{statistics.startedCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {statistics.completionRate ? `${Number(statistics.completionRate).toFixed(1)}%` : '0%'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Problems */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Problems ({assessment.assessmentProblems.length})
            </h2>
            <div className="space-y-3">
              {assessment.assessmentProblems
                .sort((a, b) => a.order - b.order)
                .map((ap, index) => (
                  <div
                    key={ap.problemId}
                    className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{ap.problem?.title || 'Unknown Problem'}</p>
                        {ap.problem?.difficulty && (
                          <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${getDifficultyColor(ap.problem.difficulty)}`}>
                            {ap.problem.difficulty.charAt(0).toUpperCase() + ap.problem.difficulty.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{ap.points} points</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
