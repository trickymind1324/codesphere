import { useAuthStore } from '@/stores/auth.store';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { submissionApi } from '@/api/submission.api';

export function DashboardPage() {
  const { user } = useAuthStore();

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => submissionApi.getUserStats(),
  });

  const { data: recentSubmissions } = useQuery({
    queryKey: ['recentSubmissions'],
    queryFn: () => submissionApi.getSubmissions({ page: 1, pageSize: 5 }),
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const acceptanceRate = userStats?.totalSubmissions && userStats?.acceptedSubmissions
    ? Math.round((userStats.acceptedSubmissions / userStats.totalSubmissions) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="border-b border-gray-200 bg-white/50 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 py-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'Developer'}! 👋
                </h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                  Ready to sharpen your coding skills today?
                </p>
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
                    <div className="text-2xl font-bold text-primary">
                      🔥 0 days
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Overview */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Your Progress</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Problems Solved */}
              <div className="surface-raised rounded-xl p-5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Problems Solved</p>
                    <p className="mt-2 text-4xl font-bold tabular-nums text-foreground">
                      {userStats?.problemsSolved || 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-2.5">
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">Keep going!</div>
              </div>

              {/* Total Submissions */}
              <div className="surface-raised rounded-xl p-5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                    <p className="mt-2 text-4xl font-bold tabular-nums text-foreground">
                      {userStats?.totalSubmissions || 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-2.5">
                    <svg className="h-6 w-6 text-state-running" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {userStats?.acceptedSubmissions || 0} accepted
                </div>
              </div>

              {/* Acceptance Rate */}
              <div className="surface-raised rounded-xl p-5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Acceptance Rate</p>
                    <p className="mt-2 text-4xl font-bold tabular-nums text-foreground">
                      {acceptanceRate}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-2.5">
                    <svg className="h-6 w-6 text-state-pass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-state-pass transition-all duration-500"
                      style={{ width: `${acceptanceRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Languages Used */}
              <div className="surface-raised rounded-xl p-5 transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Languages</p>
                    <p className="mt-2 text-4xl font-bold tabular-nums text-foreground">
                      {userStats?.languagesUsed?.length || 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-2.5">
                    <svg className="h-6 w-6 text-state-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  {userStats?.languagesUsed?.slice(0, 2).join(', ') || 'Start coding!'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                  <Link to="/submissions" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                    View all →
                  </Link>
                </div>

                {recentSubmissions?.data && recentSubmissions.data.length > 0 ? (
                  <div className="space-y-3">
                    {recentSubmissions.data.map((submission: any) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800/50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`rounded-full p-2 ${
                            submission.status === 'accepted'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {submission.status === 'accepted' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              )}
                            </svg>
                          </div>
                          <div>
                            <Link
                              to={`/problems/${submission.problem?.slug}`}
                              className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                            >
                              {submission.problem?.title}
                            </Link>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <span className="capitalize">{submission.language}</span>
                              <span>•</span>
                              <span>{submission.executionTimeMs}ms</span>
                              <span>•</span>
                              <span className="capitalize">
                                {submission.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No activity yet</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Start solving problems to see your activity here
                    </p>
                    <Link
                      to="/problems"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Browse Problems
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Profile */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    to="/problems"
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4 transition-colors hover:bg-muted"
                  >
                    <div className="rounded-lg bg-blue-600 p-2">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Solve Problems</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Practice coding challenges</div>
                    </div>
                  </Link>

                  <Link
                    to="/submissions"
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4 transition-colors hover:bg-muted"
                  >
                    <div className="rounded-lg bg-purple-600 p-2">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">View Submissions</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Track your progress</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Profile Card */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user?.name || 'Developer'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {user?.tier || 'free'} tier
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">Email</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate ml-2">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">Verified</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {user?.emailVerified ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Yes
                        </span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
