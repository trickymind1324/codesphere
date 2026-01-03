import { useAuthStore } from '@/stores/auth.store';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { submissionApi } from '@/api/submission.api';

export function DashboardPage() {
  const { user } = useAuthStore();

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => submissionApi.getUserStats(),
  });

  const { data: recentSubmissions, isLoading: submissionsLoading } = useQuery({
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
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
                    <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Problems Solved */}
              <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-500 to-indigo-600 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:border-gray-700">
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-100">Problems Solved</p>
                      <p className="mt-2 text-4xl font-bold text-white">
                        {userStats?.problemsSolved || 0}
                      </p>
                    </div>
                    <div className="rounded-full bg-white/20 p-3">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-blue-100">
                    <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    Keep going!
                  </div>
                </div>
              </div>

              {/* Total Submissions */}
              <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-purple-500 to-pink-600 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:border-gray-700">
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-100">Total Submissions</p>
                      <p className="mt-2 text-4xl font-bold text-white">
                        {userStats?.totalSubmissions || 0}
                      </p>
                    </div>
                    <div className="rounded-full bg-white/20 p-3">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-purple-100">
                    {userStats?.acceptedSubmissions || 0} accepted
                  </div>
                </div>
              </div>

              {/* Acceptance Rate */}
              <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-500 to-emerald-600 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:border-gray-700">
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-100">Acceptance Rate</p>
                      <p className="mt-2 text-4xl font-bold text-white">
                        {acceptanceRate}%
                      </p>
                    </div>
                    <div className="rounded-full bg-white/20 p-3">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-white/30">
                      <div
                        className="h-full rounded-full bg-white transition-all duration-500"
                        style={{ width: `${acceptanceRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Languages Used */}
              <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-orange-500 to-red-600 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:border-gray-700">
                <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10"></div>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-100">Languages</p>
                      <p className="mt-2 text-4xl font-bold text-white">
                        {userStats?.languagesUsed?.length || 0}
                      </p>
                    </div>
                    <div className="rounded-full bg-white/20 p-3">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-orange-100">
                    {userStats?.languagesUsed?.slice(0, 2).join(', ') || 'Start coding!'}
                  </div>
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
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 transition-all hover:scale-105 hover:shadow-md dark:border-gray-700 dark:from-blue-900/20 dark:to-indigo-900/20"
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
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 p-4 transition-all hover:scale-105 hover:shadow-md dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20"
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white">
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
