import { useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/axios';

type EventType =
  | 'paste'
  | 'copy'
  | 'tab_blur'
  | 'tab_focus'
  | 'window_blur'
  | 'window_focus'
  | 'execution'
  | 'submission';

interface TrackedEvent {
  offsetMs: number;
  eventType: EventType;
  problemId?: string;
  metadata?: Record<string, unknown>;
}

interface Options {
  /** Invitation token from the assessment URL (e.g. /assessment/:token). */
  invitationToken: string;
  flushIntervalMs?: number;
  enabled?: boolean;
}

/**
 * Captures candidate behavior signals during an assessment session:
 * paste/copy, tab visibility, and window focus. Batches to the
 * assessment-service endpoint, which resolves the invitation token
 * server-side and binds the events to that invitation.
 *
 * Exec/submit are tracked via mark() — call from the page that owns those
 * actions.
 */
export function useGlassBoxTracker({
  invitationToken,
  flushIntervalMs = 5_000,
  enabled = true,
}: Options) {
  const buffer = useRef<TrackedEvent[]>([]);
  const startedAt = useRef<number>(Date.now());
  const endpoint = `/api/v1/glass-box/invitations/${encodeURIComponent(invitationToken)}/events`;

  const now = () => Date.now() - startedAt.current;

  const push = useCallback(
    (eventType: EventType, metadata?: Record<string, unknown>, problemId?: string) => {
      if (!enabled) return;
      buffer.current.push({ offsetMs: now(), eventType, problemId, metadata });
    },
    [enabled],
  );

  const flush = useCallback(async () => {
    if (!enabled || buffer.current.length === 0) return;
    const events = buffer.current;
    buffer.current = [];
    try {
      await api.post(endpoint, { events });
    } catch {
      // best-effort telemetry — never block the candidate
    }
  }, [endpoint, enabled]);

  const mark = useCallback(
    (eventType: EventType, metadata?: Record<string, unknown>, problemId?: string) => {
      push(eventType, metadata, problemId);
    },
    [push],
  );

  useEffect(() => {
    if (!enabled) return;

    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') ?? '';
      push('paste', { textLength: text.length });
    };
    const onCopy = () => push('copy');
    const onVisibility = () => {
      if (document.hidden) push('tab_blur');
      else push('tab_focus');
    };
    const onWindowBlur = () => push('window_blur');
    const onWindowFocus = () => push('window_focus');

    document.addEventListener('paste', onPaste);
    document.addEventListener('copy', onCopy);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);

    const intervalId = window.setInterval(flush, flushIntervalMs);

    const onUnload = () => {
      if (buffer.current.length === 0) return;
      navigator.sendBeacon?.(
        endpoint,
        new Blob([JSON.stringify({ events: buffer.current })], {
          type: 'application/json',
        }),
      );
      buffer.current = [];
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('beforeunload', onUnload);
      window.clearInterval(intervalId);
      void flush();
    };
  }, [enabled, flush, flushIntervalMs, endpoint, push]);

  return { mark, flush };
}
