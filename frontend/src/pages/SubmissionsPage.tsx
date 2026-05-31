import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { submissionApi, QuerySubmissionsParams } from '@/api/submission.api';
import { AppLayout } from '@/components/layout/AppLayout';

export function SubmissionsPage() {
  const [filters, setFilters] = useState<QuerySubmissionsParams>({
    page: 1,
    pageSize: 20,
    status: undefined,
    language: undefined,
  });

  const { data: submissionsData, isLoading, error } = useQuery({
    queryKey: ['submissions', filters],
    queryFn: () => submissionApi.getSubmissions(filters),
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => submissionApi.getUserStats(),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'wrong_answer':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'time_limit_exceeded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'memory_limit_exceeded':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'runtime_error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'compilation_error':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Submissions</h1>
          <p className="mt-2 text-muted-foreground">
            View your submission history and track your progress
          </p>
        </div>

        {/* User Statistics */}
        {userStats && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-2xl font-bold">{userStats.totalSubmissions}</div>
              <div className="text-sm text-muted-foreground">Total Submissions</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-2xl font-bold text-green-600">
                {userStats.acceptedSubmissions}
              </div>
              <div className="text-sm text-muted-foreground">Accepted</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-2xl font-bold">{userStats.problemsSolved}</div>
              <div className="text-sm text-muted-foreground">Problems Solved</div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="text-2xl font-bold">{userStats.languagesUsed?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Languages Used</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {userStats.languagesUsed?.join(', ') || 'None'}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value || undefined, page: 1 })
            }
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="accepted">Accepted</option>
            <option value="wrong_answer">Wrong Answer</option>
            <option value="time_limit_exceeded">Time Limit Exceeded</option>
            <option value="runtime_error">Runtime Error</option>
            <option value="compilation_error">Compilation Error</option>
          </select>
          <select
            value={filters.language || ''}
            onChange={(e) =>
              setFilters({ ...filters, language: e.target.value || undefined, page: 1 })
            }
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Languages</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="go">Go</option>
          </select>
        </div>

        {/* Submissions Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading submissions...</div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            Error loading submissions. Please try again.
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Problem
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Language
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Runtime
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Memory
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submissionsData?.data?.map((submission) => (
                    <tr
                      key={submission.id}
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/problems/${submission.problem.slug}?submissionId=${submission.id}`}
                    >
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(submission.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium hover:text-primary">
                            {submission.problem.title}
                          </span>
                          <span
                            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${getDifficultyColor(submission.problem.difficulty)}`}
                          >
                            {submission.problem.difficulty.charAt(0).toUpperCase() +
                              submission.problem.difficulty.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(submission.status)}`}
                          >
                            {formatStatus(submission.status)}
                          </span>
                          {submission.status !== 'accepted' && (
                            <span className="text-xs text-muted-foreground">
                              {submission.passedTestCases}/{submission.totalTestCases} passed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="rounded-md bg-muted px-2 py-1 text-xs font-mono">
                          {submission.language}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {submission.executionTimeMs
                          ? `${submission.executionTimeMs}ms`
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {submission.memoryUsageKb
                          ? `${(submission.memoryUsageKb / 1024).toFixed(2)}MB`
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {submissionsData && submissionsData.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  Showing {((filters.page || 1) - 1) * (filters.pageSize || 20) + 1} to{' '}
                  {Math.min(
                    (filters.page || 1) * (filters.pageSize || 20),
                    submissionsData.total
                  )}{' '}
                  of {submissionsData.total} submissions
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={(filters.page || 1) === 1}
                    onClick={() =>
                      setFilters({ ...filters, page: (filters.page || 1) - 1 })
                    }
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
                  >
                    Previous
                  </button>
                  <button
                    disabled={(filters.page || 1) === submissionsData.totalPages}
                    onClick={() =>
                      setFilters({ ...filters, page: (filters.page || 1) + 1 })
                    }
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && submissionsData?.data?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold">No submissions yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {filters.status || filters.language
                ? 'Try adjusting your filters'
                : 'Start solving problems to see your submissions here'}
            </p>
            {!filters.status && !filters.language && (
              <Link
                to="/problems"
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Browse Problems
              </Link>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
