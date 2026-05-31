import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { problemApi } from '@/api/problem.api';
import { ProblemDetailPage } from './ProblemDetailPage';
import { DebuggingProblemPage } from './DebuggingProblemPage';

/**
 * ProblemRouter component that conditionally renders the appropriate
 * problem page based on the problem type.
 *
 * - algorithmic (default) -> ProblemDetailPage (single-file editor)
 * - debugging -> DebuggingProblemPage (multi-file editor with terminal)
 */
export function ProblemRouter() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch minimal problem data to determine the type
  const { data: problem, isLoading, error } = useQuery({
    queryKey: ['problem-type', slug],
    queryFn: () => problemApi.getProblem(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Problem not found</h2>
          <p className="text-gray-400">The problem you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Route to appropriate page based on problem type
  if (problem.problemType === 'debugging') {
    return <DebuggingProblemPage />;
  }

  // Default to algorithmic problem page
  return <ProblemDetailPage />;
}
