import { useEffect, useState, useCallback } from 'react';

interface AssessmentTimerProps {
  durationMinutes: number;
  startedAt: string;
  onTimeExpired: () => void;
  onWarning?: () => void;
}

export function AssessmentTimer({
  durationMinutes,
  startedAt,
  onTimeExpired,
  onWarning,
}: AssessmentTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasWarned, setHasWarned] = useState(false);

  const calculateTimeRemaining = useCallback(() => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const elapsed = now - start;
    const totalDuration = durationMinutes * 60 * 1000;
    const remaining = totalDuration - elapsed;
    return Math.max(0, remaining);
  }, [durationMinutes, startedAt]);

  useEffect(() => {
    // Initial calculation
    const remaining = calculateTimeRemaining();

    if (remaining <= 0) {
      onTimeExpired();
      return;
    }

    setTimeRemaining(remaining);

    // Update every second
    const interval = setInterval(() => {
      const newRemaining = calculateTimeRemaining();

      if (newRemaining <= 0) {
        clearInterval(interval);
        setTimeRemaining(0);
        onTimeExpired();
        return;
      }

      setTimeRemaining(newRemaining);

      // Trigger warning at 5 minutes (300000 ms)
      if (newRemaining <= 300000 && !hasWarned && onWarning) {
        setHasWarned(true);
        onWarning();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTimeRemaining, onTimeExpired, onWarning, hasWarned]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isWarning = timeRemaining <= 300000; // 5 minutes
  const isCritical = timeRemaining <= 60000; // 1 minute

  return (
    <div className="flex items-center gap-3">
      {isWarning && (
        <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
          <svg
            className={`h-5 w-5 ${
              isCritical
                ? 'animate-pulse text-red-600 dark:text-red-400'
                : 'text-yellow-600 dark:text-yellow-400'
            }`}
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
        </div>
      )}
      <div
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-semibold ${
          isCritical
            ? 'animate-pulse bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
            : isWarning
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
        }`}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {formatTime(timeRemaining)}
      </div>
    </div>
  );
}
