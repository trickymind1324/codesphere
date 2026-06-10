import { useCallback, useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor';
import { api } from '@/lib/axios';

type EventType = 'edit' | 'run' | 'submit' | 'cursor';

interface RecordedEvent {
  offsetMs: number;
  eventType: EventType;
  payload: Record<string, unknown>;
}

interface Options {
  sessionId: string;
  problemId?: string;
  language: string;
  flushIntervalMs?: number;
  enabled?: boolean;
}

/**
 * Captures Monaco editor edits and ad-hoc run/submit markers, batches them,
 * and posts to the problem-service /playback/events endpoint.
 *
 * Caller is responsible for generating sessionId once per session (uuid).
 * The hook must be attached to a Monaco editor instance via attach().
 */
export function usePlaybackRecorder({
  sessionId,
  problemId,
  language,
  flushIntervalMs = 5_000,
  enabled = true,
}: Options) {
  const buffer = useRef<RecordedEvent[]>([]);
  const startedAt = useRef<number>(Date.now());
  const disposers = useRef<Array<() => void>>([]);

  const now = () => Date.now() - startedAt.current;

  const flush = useCallback(async () => {
    if (!enabled || buffer.current.length === 0) return;
    const events = buffer.current;
    buffer.current = [];
    try {
      await api.post('/api/v1/playback/events', {
        sessionId,
        problemId,
        language,
        events,
      });
    } catch {
      // On failure, drop the batch — this is best-effort telemetry, never
      // block the user's editing experience.
    }
  }, [sessionId, problemId, language, enabled]);

  const attach = useCallback(
    (instance: editor.IStandaloneCodeEditor) => {
      if (!enabled) return;
      // Record the initial buffer so the viewer can reconstruct the session
      // from a known starting state before applying deltas.
      buffer.current.push({
        offsetMs: now(),
        eventType: 'edit',
        payload: { snapshot: true, text: instance.getValue() },
      });
      const sub = instance.onDidChangeModelContent((e) => {
        for (const change of e.changes) {
          buffer.current.push({
            offsetMs: now(),
            eventType: 'edit',
            payload: {
              range: change.range,
              rangeLength: change.rangeLength,
              text: change.text,
            },
          });
        }
      });
      disposers.current.push(() => sub.dispose());
    },
    [enabled],
  );

  const mark = useCallback(
    (eventType: EventType, payload: Record<string, unknown> = {}) => {
      if (!enabled) return;
      buffer.current.push({ offsetMs: now(), eventType, payload });
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(flush, flushIntervalMs);
    const beforeUnload = () => {
      // Best-effort final flush. Browsers may drop async work on unload, but
      // keepalive lets the request finish.
      if (buffer.current.length > 0) {
        navigator.sendBeacon?.(
          '/api/v1/playback/events',
          new Blob(
            [
              JSON.stringify({
                sessionId,
                problemId,
                language,
                events: buffer.current,
              }),
            ],
            { type: 'application/json' },
          ),
        );
        buffer.current = [];
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('beforeunload', beforeUnload);
      disposers.current.forEach((d) => d());
      disposers.current = [];
      void flush();
    };
  }, [enabled, flush, flushIntervalMs, sessionId, problemId, language]);

  return { attach, mark, flush };
}
