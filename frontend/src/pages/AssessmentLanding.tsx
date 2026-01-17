import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { assessmentApi, AssessmentStatus, InvitationStatus } from '@/api/assessment.api';
import toast from 'react-hot-toast';

export function AssessmentLanding() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { data: validationData, isLoading, error } = useQuery({
    queryKey: ['validate-invitation', token],
    queryFn: () => assessmentApi.validateToken(token!),
    enabled: !!token,
    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: () => assessmentApi.startAssessment(token!),
    onSuccess: () => {
      toast.success('Assessment started!');
      navigate(`/assessment/${token}/problem/0`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start assessment');
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !validationData?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950">
            <svg
              className="mx-auto h-16 w-16 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-red-900 dark:text-red-100">
              Invalid or Expired Link
            </h2>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              This assessment link is no longer valid or has expired. Please contact the recruiter for a new invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { assessment, invitation } = validationData;

  if (!assessment || !invitation) {
    return null;
  }

  if (invitation.status === InvitationStatus.COMPLETED) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950">
            <svg
              className="mx-auto h-16 w-16 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-green-900 dark:text-green-100">
              Assessment Completed
            </h2>
            <p className="mt-2 text-sm text-green-700 dark:text-green-300">
              You have already completed this assessment.
            </p>
            {invitation.score !== undefined && (
              <div className="mt-4 rounded-md bg-green-100 dark:bg-green-900 p-4">
                <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                  Your Score: {invitation.percentage != null ? Number(invitation.percentage).toFixed(1) : '0'}%
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {invitation.problemsSolved} / {invitation.totalProblems} problems solved
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleStartAssessment = () => {
    if (!agreedToTerms) {
      toast.error('Please agree to the instructions');
      return;
    }

    startMutation.mutate();
  };

  const isResuming = invitation.status === InvitationStatus.STARTED;
  const buttonText = isResuming ? 'Resume Assessment' : 'Begin Assessment';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {assessment.title}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-200">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {assessment.durationMinutes} minutes
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {assessment.assessmentProblems.length} problems
            </span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
          {/* Description */}
          {assessment.description && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground">About This Assessment</h2>
              <p className="mt-2 text-muted-foreground">{assessment.description}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground">Instructions</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>You have <strong>{assessment.durationMinutes} minutes</strong> to complete {assessment.assessmentProblems.length} problems</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>The timer will start when you click "{buttonText}"</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Your code is automatically saved as you type</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>The assessment will auto-submit when time expires</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>You can navigate between problems freely during the assessment</span>
              </li>
            </ul>
          </div>

          {/* Problems List */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground">Problems ({assessment.assessmentProblems.length})</h2>
            <div className="mt-4 space-y-3">
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
                        <p className="font-medium text-foreground">{ap.problem?.title}</p>
                        {ap.problem?.difficulty && (
                          <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            ap.problem.difficulty === 'easy'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : ap.problem.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {ap.problem.difficulty.charAt(0).toUpperCase() + ap.problem.difficulty.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{ap.points} points</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="mb-6 rounded-md bg-muted/50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-foreground">
                I understand the instructions and agree to complete this assessment honestly and independently
              </span>
            </label>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={handleStartAssessment}
              disabled={!agreedToTerms || startMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {startMutation.isPending ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Starting...
                </>
              ) : (
                <>
                  {isResuming ? (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {buttonText}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need help? Contact the recruiter who sent you this assessment.
        </p>
      </div>
    </div>
  );
}
