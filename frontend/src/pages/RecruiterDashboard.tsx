import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { assessmentApi, AssessmentStatus, QueryAssessmentsParams } from '@/api/assessment.api';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

export function RecruiterDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [filters, setFilters] = useState<QueryAssessmentsParams>({
    page: 1,
    pageSize: 20,
    status: undefined,
    search: '',
  });

  const { data: assessmentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['assessments', filters],
    queryFn: () => assessmentApi.getAssessments(filters),
  });

  const handleDeleteAssessment = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await assessmentApi.deleteAssessment(id);
      toast.success('Assessment deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete assessment');
    }
  };

  const handleArchiveAssessment = async (id: string, title: string) => {
    try {
      await assessmentApi.updateStatus(id, AssessmentStatus.ARCHIVED);
      toast.success(`"${title}" archived successfully`);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to archive assessment');
    }
  };

  const handlePublishAssessment = async (id: string, title: string) => {
    try {
      await assessmentApi.updateStatus(id, AssessmentStatus.PUBLISHED);
      toast.success(`"${title}" published successfully`);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to publish assessment');
    }
  };

  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case AssessmentStatus.PUBLISHED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case AssessmentStatus.DRAFT:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case AssessmentStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalAssessments = assessmentsData?.total || 0;
  const publishedCount = assessmentsData?.data?.filter(a => a.status === AssessmentStatus.PUBLISHED).length || 0;
  const draftCount = assessmentsData?.data?.filter(a => a.status === AssessmentStatus.DRAFT).length || 0;
  const totalInvitations = assessmentsData?.data?.reduce((sum, a) => sum + a.invitationsCount, 0) || 0;

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
              <h1 className="text-3xl font-bold tracking-tight">Recruiter Dashboard</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage assessments, invite candidates, and view results
              </p>
            </div>
            <button
              onClick={() => navigate('/recruiter/assessments/new')}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Assessment
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-background p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Assessments</p>
                <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mt-2 text-3xl font-bold">{totalAssessments}</p>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Published</p>
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mt-2 text-3xl font-bold">{publishedCount}</p>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="mt-2 text-3xl font-bold">{draftCount}</p>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Invitations</p>
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="mt-2 text-3xl font-bold">{totalInvitations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-4">
            <input
              type="text"
              placeholder="Search assessments..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as AssessmentStatus || undefined, page: 1 })}
              className="rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Status</option>
              <option value={AssessmentStatus.PUBLISHED}>Published</option>
              <option value={AssessmentStatus.DRAFT}>Draft</option>
              <option value={AssessmentStatus.ARCHIVED}>Archived</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <div className="space-y-4 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading assessments...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load assessments. Please try again.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && assessmentsData?.data?.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium">No assessments found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first assessment.
            </p>
            <button
              onClick={() => navigate('/recruiter/assessments/new')}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Assessment
            </button>
          </div>
        )}

        {/* Assessments Table */}
        {!isLoading && !error && assessmentsData && assessmentsData.data?.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Problems
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Invitations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Completion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assessmentsData.data?.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-foreground">{assessment.title}</div>
                          {assessment.description && (
                            <div className="mt-1 text-sm text-muted-foreground line-clamp-1">
                              {assessment.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(assessment.status)}`}>
                          {formatStatus(assessment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {assessment.assessmentProblems.length}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {assessment.durationMinutes} min
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {assessment.invitationsCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {assessment.completedCount} / {assessment.invitationsCount}
                        {assessment.invitationsCount > 0 && (
                          <span className="ml-2 text-xs">
                            ({Math.round((assessment.completedCount / assessment.invitationsCount) * 100)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(assessment.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/recruiter/assessments/${assessment.id}`)}
                            className="rounded px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                            title="View Details"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/recruiter/assessments/${assessment.id}/edit`)}
                            className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                            title="Edit"
                          >
                            Edit
                          </button>
                          {assessment.status === AssessmentStatus.PUBLISHED && (
                            <button
                              onClick={() => navigate(`/recruiter/assessments/${assessment.id}/invite`)}
                              className="rounded px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                              title="Invite Candidates"
                            >
                              Invite
                            </button>
                          )}
                          {assessment.invitationsCount > 0 && (
                            <button
                              onClick={() => navigate(`/recruiter/assessments/${assessment.id}/results`)}
                              className="rounded px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900"
                              title="View Results"
                            >
                              Results
                            </button>
                          )}
                          {assessment.status === AssessmentStatus.DRAFT && (
                            <button
                              onClick={() => handlePublishAssessment(assessment.id, assessment.title)}
                              className="rounded px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                              title="Publish"
                            >
                              Publish
                            </button>
                          )}
                          {assessment.status !== AssessmentStatus.ARCHIVED && (
                            <button
                              onClick={() => handleArchiveAssessment(assessment.id, assessment.title)}
                              className="rounded px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900"
                              title="Archive"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAssessment(assessment.id, assessment.title)}
                            className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {assessmentsData.totalPages > 1 && (
              <div className="border-t border-border bg-muted/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((assessmentsData.page - 1) * assessmentsData.pageSize) + 1} to{' '}
                    {Math.min(assessmentsData.page * assessmentsData.pageSize, assessmentsData.total)} of{' '}
                    {assessmentsData.total} assessments
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                      disabled={assessmentsData.page === 1}
                      className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                      disabled={assessmentsData.page === assessmentsData.totalPages}
                      className="rounded border border-border px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
