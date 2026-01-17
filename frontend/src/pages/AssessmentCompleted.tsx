import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assessmentApi } from '@/api/assessment.api';

export function AssessmentCompleted() {
  const { token } = useParams<{ token: string }>();

  const { data: validationData, isLoading } = useQuery({
    queryKey: ['validate-invitation', token],
    queryFn: () => assessmentApi.validateToken(token!),
    enabled: !!token,
    retry: false,
  });

  const invitation = validationData?.invitation;
  const assessment = validationData?.assessment;

  useEffect(() => {
    // Clear any saved assessment data from localStorage
    if (assessment) {
      assessment.assessmentProblems.forEach(p => {
        localStorage.removeItem(`assessment_${token}_${p.problemId}`);
      });
    }
  }, [assessment, token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-lg border border-border bg-card p-12 text-center shadow-xl">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600">
            <svg
              className="h-12 w-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground">
            Assessment Submitted Successfully!
          </h1>

          {/* Message */}
          <p className="mt-4 text-lg text-muted-foreground">
            Thank you for completing the assessment.
          </p>

          {assessment && (
            <p className="mt-2 text-base text-muted-foreground">
              "{assessment.title}"
            </p>
          )}

          {/* Results Summary */}
          {invitation && (
            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {invitation.problemsSolved !== undefined && invitation.totalProblems !== undefined && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Problems Solved</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {invitation.problemsSolved} / {invitation.totalProblems}
                    </p>
                  </div>
                )}

                {invitation.percentage !== undefined && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {Number(invitation.percentage).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>

              {invitation.completedAt && (
                <p className="text-sm text-muted-foreground">
                  Completed at: {new Date(invitation.completedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Next Steps */}
          <div className="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-950">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              What happens next?
            </h2>
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              The recruiter will review your submission and contact you with the results.
              You will receive an email notification once your assessment has been reviewed.
            </p>
          </div>

          {/* Footer Note */}
          <p className="mt-8 text-sm text-muted-foreground">
            You can close this window now.
          </p>
        </div>
      </div>
    </div>
  );
}
