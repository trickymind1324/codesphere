import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { glassBoxApi } from '@/api/glassbox.api';
import { api } from '@/lib/axios';

interface Props {
  invitationId: string;
  scorePercent?: number | null;
  problemsSolved?: number | null;
  totalProblems?: number | null;
  durationMinutes?: number | null;
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

const EVENT_LABELS: Record<string, string> = {
  paste: 'Pastes',
  copy: 'Copies',
  tab_blur: 'Tab switches away',
  tab_focus: 'Tab returns',
  window_blur: 'Window blurs',
  window_focus: 'Window focuses',
  execution: 'Code runs',
  submission: 'Submissions',
};

/**
 * Glass Box behavioral report for one candidate invitation: process
 * signals (paste activity, focus loss, execution cadence) plus an optional
 * AI-written narrative.
 */
export function GlassBoxReport({
  invitationId,
  scorePercent,
  problemsSolved,
  totalProblems,
  durationMinutes,
}: Props) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['glass-box-summary', invitationId],
    queryFn: () => glassBoxApi.getSummary(invitationId),
  });

  const handleGenerateAiSummary = async () => {
    if (!summary) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await api.post('/api/v1/ai/glass-box-summary', {
        total_events: summary.totalEvents,
        counts_by_type: summary.countsByType,
        paste_count: summary.pasteCount,
        paste_total_chars: summary.pasteTotalChars,
        longest_tab_blur_ms: summary.longestTabBlurMs,
        duration_minutes: durationMinutes ?? null,
        score_percent: scorePercent ?? null,
        problems_solved: problemsSolved ?? null,
        total_problems: totalProblems ?? null,
      });
      setAiSummary(response.data.summary);
    } catch {
      setAiError('AI service unavailable — showing raw signals only.');
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading Glass Box data…</div>;
  }

  if (error || !summary) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Failed to load Glass Box data for this candidate.
      </div>
    );
  }

  if (summary.totalEvents === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No behavioral events recorded for this session. The candidate may have
        taken the assessment before Glass Box tracking was enabled.
      </div>
    );
  }

  const executions = summary.countsByType['execution'] ?? 0;
  const tabBlurs = summary.countsByType['tab_blur'] ?? 0;

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground">Code runs</p>
          <p className="mt-1 text-xl font-bold">{executions}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground">Pastes</p>
          <p className="mt-1 text-xl font-bold">{summary.pasteCount}</p>
          {summary.pasteTotalChars > 0 && (
            <p className="text-xs text-muted-foreground">
              {summary.pasteTotalChars.toLocaleString()} chars
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground">Tab switches</p>
          <p className="mt-1 text-xl font-bold">{tabBlurs}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-medium text-muted-foreground">Longest time away</p>
          <p className="mt-1 text-xl font-bold">{formatMs(summary.longestTabBlurMs)}</p>
        </div>
      </div>

      <details className="rounded-lg border border-border bg-background">
        <summary className="cursor-pointer p-3 text-sm font-medium">
          All event counts ({summary.totalEvents} events)
        </summary>
        <div className="grid grid-cols-2 gap-2 p-3 pt-0 sm:grid-cols-4">
          {Object.entries(summary.countsByType).map(([type, count]) => (
            <div key={type} className="text-sm">
              <span className="text-muted-foreground">{EVENT_LABELS[type] ?? type}:</span>{' '}
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </details>

      <div className="rounded-lg border border-border bg-background p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">AI summary</p>
          <button
            onClick={handleGenerateAiSummary}
            disabled={aiLoading}
            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {aiLoading ? 'Generating…' : aiSummary ? 'Regenerate' : 'Generate'}
          </button>
        </div>
        {aiSummary && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{aiSummary}</p>
        )}
        {aiError && <p className="mt-3 text-sm text-red-500">{aiError}</p>}
        {!aiSummary && !aiError && !aiLoading && (
          <p className="mt-3 text-xs text-muted-foreground">
            Generates a neutral narrative of the candidate's working style from
            the signals above.
          </p>
        )}
      </div>
    </div>
  );
}
