import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { problemApi, QueryProblemsParams } from '@/api/problem.api';
import { useAuthStore } from '@/stores/auth.store';

export function ProblemsPage() {
  const { user, logout } = useAuthStore();
  const [filters, setFilters] = useState<QueryProblemsParams>({
    page: 1,
    pageSize: 20,
    difficulty: undefined,
    search: '',
  });

  const { data: problemsData, isLoading, error } = useQuery({
    queryKey: ['problems', filters],
    queryFn: () => problemApi.getProblems(filters),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => problemApi.getTags(),
  });

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
                to="/problems"
                className="text-sm font-medium text-foreground hover:text-primary"
              >
                Problems
              </Link>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email}
            </span>
            <button
              onClick={logout}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Problems</h1>
          <p className="mt-2 text-muted-foreground">
            Practice coding problems and improve your skills
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search problems..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 1 })
            }
            className="flex-1 min-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <select
            value={filters.difficulty || ''}
            onChange={(e) =>
              setFilters({ ...filters, difficulty: e.target.value || undefined, page: 1 })
            }
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Problems Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading problems...</div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            Error loading problems. Please try again.
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Acceptance
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Difficulty
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Tags
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {problemsData?.data.map((problem) => (
                    <tr
                      key={problem.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <div className="h-6 w-6 rounded-full border-2 border-muted" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/problems/${problem.slug}`}
                          className="flex items-center gap-2 font-medium hover:text-primary"
                        >
                          {problem.title}
                          {problem.isPremium && (
                            <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Premium
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {problem.acceptanceRate > 0
                          ? `${problem.acceptanceRate.toFixed(1)}%`
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getDifficultyBadge(problem.difficulty)}`}
                        >
                          {problem.difficulty.charAt(0).toUpperCase() +
                            problem.difficulty.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {problem.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {problem.tags.length > 3 && (
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                              +{problem.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {problemsData && problemsData.meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  Showing {((filters.page || 1) - 1) * (filters.pageSize || 20) + 1} to{' '}
                  {Math.min(
                    (filters.page || 1) * (filters.pageSize || 20),
                    problemsData.meta.total
                  )}{' '}
                  of {problemsData.meta.total} problems
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
                    disabled={(filters.page || 1) === problemsData.meta.totalPages}
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
        {!isLoading && problemsData?.data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold">No problems found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {filters.search || filters.difficulty
                ? 'Try adjusting your filters'
                : 'Check back later for new problems'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
