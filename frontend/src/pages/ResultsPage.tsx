import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { assessmentApi, InvitationStatus } from '@/api/assessment.api';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

export function ResultsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('all');

  // Fetch assessment details
  const { data: assessment, isLoading: isLoadingAssessment } = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => assessmentApi.getAssessment(id!),
    enabled: !!id,
  });

  // Fetch invitations/results
  const { data: invitations, isLoading: isLoadingInvitations, refetch } = useQuery({
    queryKey: ['invitations', id],
    queryFn: () => assessmentApi.getInvitations(id!),
    enabled: !!id,
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ['statistics', id],
    queryFn: () => assessmentApi.getStatistics(id!),
    enabled: !!id,
  });

  const resendInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => assessmentApi.resendInvitation(invitationId),
    onSuccess: () => {
      toast.success('Invitation resent successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resend invitation');
    },
  });

  const handleResendInvitation = (invitationId: string, candidateEmail: string) => {
    if (confirm(`Resend invitation to ${candidateEmail}?`)) {
      resendInvitationMutation.mutate(invitationId);
    }
  };

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case InvitationStatus.COMPLETED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case InvitationStatus.STARTED:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case InvitationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case InvitationStatus.EXPIRED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTimeSpent = (startedAt: string | undefined, completedAt: string | undefined) => {
    if (!startedAt || !completedAt) return 'N/A';
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const minutes = Math.round((end - start) / 60000);
    return `${minutes} min`;
  };

  const exportToCSV = () => {
    if (!invitations || invitations.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Name', 'Email', 'Status', 'Score', 'Percentage', 'Problems Solved', 'Started At', 'Completed At', 'Time Spent'];
    const rows = invitations.map((inv) => [
      inv.candidateName,
      inv.candidateEmail,
      inv.status,
      inv.score || 'N/A',
      inv.percentage ? `${inv.percentage}%` : 'N/A',
      inv.problemsSolved ? `${inv.problemsSolved}/${inv.totalProblems}` : 'N/A',
      inv.startedAt ? formatDate(inv.startedAt) : 'N/A',
      inv.completedAt ? formatDate(inv.completedAt) : 'N/A',
      calculateTimeSpent(inv.startedAt, inv.completedAt),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assessment-results-${id}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Results exported to CSV');
  };

  const filteredInvitations = invitations?.filter((inv) =>
    statusFilter === 'all' ? true : inv.status === statusFilter
  );

  if (isLoadingAssessment || isLoadingInvitations) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Assessment not found</p>
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
              <h1 className="text-3xl font-bold tracking-tight">Assessment Results</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Results for: <span className="font-medium text-foreground">{assessment.title}</span>
              </p>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <span>{assessment.assessmentProblems.length} problems</span>
                <span>•</span>
                <span>{assessment.durationMinutes} minutes</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </button>
              <button
                onClick={() => navigate(`/recruiter/assessments/${id}/invite`)}
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
                Invite More
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Total Invites</p>
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="mt-2 text-3xl font-bold">{statistics.totalInvitations}</p>
              </div>

              <div className="rounded-lg border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="mt-2 text-3xl font-bold">{statistics.completedCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {statistics.completionRate.toFixed(1)}% completion rate
                </p>
              </div>

              <div className="rounded-lg border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Started</p>
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="mt-2 text-3xl font-bold">{statistics.startedCount}</p>
              </div>

              <div className="rounded-lg border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="mt-2 text-3xl font-bold">{statistics.pendingCount}</p>
              </div>

              <div className="rounded-lg border border-border bg-background p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <p className="mt-2 text-3xl font-bold">{statistics.averageScore.toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex items-center justify-between">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvitationStatus | 'all')}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value={InvitationStatus.PENDING}>Pending</option>
            <option value={InvitationStatus.STARTED}>Started</option>
            <option value={InvitationStatus.COMPLETED}>Completed</option>
            <option value={InvitationStatus.EXPIRED}>Expired</option>
          </select>

          <p className="text-sm text-muted-foreground">
            Showing {filteredInvitations?.length || 0} of {invitations?.length || 0} invitations
          </p>
        </div>

        {/* Empty State */}
        {!invitations || invitations.length === 0 ? (
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium">No invitations sent</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by inviting candidates to take this assessment.
            </p>
            <button
              onClick={() => navigate(`/recruiter/assessments/${id}/invite`)}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Send Invitations
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Problems
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Time Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Completed
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInvitations?.map((invitation) => (
                    <tr key={invitation.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-foreground">{invitation.candidateName}</div>
                          <div className="text-sm text-muted-foreground">{invitation.candidateEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                            invitation.status
                          )}`}
                        >
                          {formatStatus(invitation.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {invitation.score !== null && invitation.score !== undefined ? (
                          <div>
                            <div className="font-medium text-foreground">{invitation.percentage}%</div>
                            <div className="text-sm text-muted-foreground">
                              {invitation.score} / {invitation.totalProblems ? invitation.totalProblems * 10 : 0} pts
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {invitation.problemsSolved !== null && invitation.problemsSolved !== undefined
                          ? `${invitation.problemsSolved} / ${invitation.totalProblems || assessment.assessmentProblems.length}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {calculateTimeSpent(invitation.startedAt, invitation.completedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(invitation.startedAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(invitation.completedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(invitation.status === InvitationStatus.PENDING ||
                          invitation.status === InvitationStatus.EXPIRED) && (
                          <button
                            onClick={() => handleResendInvitation(invitation.id, invitation.candidateEmail)}
                            disabled={resendInvitationMutation.isPending}
                            className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-blue-900"
                          >
                            Resend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
