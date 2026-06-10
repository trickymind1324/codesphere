import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { api } from '@/lib/axios';

interface PlaybackEvent {
  id: string;
  eventType: 'edit' | 'run' | 'submit' | 'cursor';
  offsetMs: number;
  payload: {
    snapshot?: boolean;
    text?: string;
    range?: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    };
  };
  language?: string;
}

interface SessionResponse {
  sessionId: string;
  count: number;
  events: PlaybackEvent[];
}

const SPEED_OPTIONS = [1, 2, 5, 10, 20];

/**
 * Code Playback viewer — replays a recorded coding session into a read-only
 * Monaco editor at adjustable speed.
 */
export function PlaybackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const timerRef = useRef<number | null>(null);
  const positionRef = useRef(0); // index of next event to apply

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [progress, setProgress] = useState(0);
  const [lastMarker, setLastMarker] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['playback-session', sessionId],
    queryFn: async (): Promise<SessionResponse> => {
      const response = await api.get(`/api/v1/playback/sessions/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
  });

  const events = data?.events ?? [];
  const totalMs = events.length > 0 ? events[events.length - 1].offsetMs : 0;

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const applyEvent = (event: PlaybackEvent) => {
    const model = editorRef.current?.getModel();
    if (!model) return;

    if (event.eventType === 'edit') {
      if (event.payload.snapshot) {
        model.setValue(event.payload.text ?? '');
      } else if (event.payload.range) {
        model.applyEdits([
          { range: event.payload.range, text: event.payload.text ?? '' },
        ]);
      }
    } else if (event.eventType === 'run') {
      setLastMarker('▶ Ran code');
    } else if (event.eventType === 'submit') {
      setLastMarker('✓ Submitted');
    }
  };

  const scheduleNext = (speedNow: number) => {
    const idx = positionRef.current;
    if (idx >= events.length) {
      setIsPlaying(false);
      setProgress(100);
      return;
    }

    const prevOffset = idx === 0 ? 0 : events[idx - 1].offsetMs;
    const delay = Math.max(0, events[idx].offsetMs - prevOffset) / speedNow;

    timerRef.current = window.setTimeout(() => {
      applyEvent(events[idx]);
      positionRef.current = idx + 1;
      setProgress(totalMs > 0 ? (events[idx].offsetMs / totalMs) * 100 : 100);
      scheduleNext(speedNow);
    }, Math.min(delay, 2_000)); // cap long idle gaps so replays stay watchable
  };

  const handlePlay = () => {
    if (events.length === 0) return;
    if (positionRef.current >= events.length) {
      handleRestart();
      return;
    }
    setIsPlaying(true);
    scheduleNext(speed);
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopTimer();
  };

  const handleRestart = () => {
    stopTimer();
    positionRef.current = 0;
    setProgress(0);
    setLastMarker(null);
    editorRef.current?.getModel()?.setValue('');
    setIsPlaying(true);
    scheduleNext(speed);
  };

  const handleSpeedChange = (next: number) => {
    setSpeed(next);
    if (isPlaying) {
      stopTimer();
      scheduleNext(next);
    }
  };

  useEffect(() => stopTimer, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading session…</div>
      </div>
    );
  }

  if (error || !data || events.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">🎬</div>
          <h2 className="text-2xl font-bold">No recording found</h2>
          <p className="mt-2 text-muted-foreground">
            This session has no recorded events yet. Solve a problem first,
            then come back to watch the replay.
          </p>
          <Link to="/problems" className="mt-4 inline-block text-primary hover:underline">
            ← Back to problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <nav className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <Link to="/problems" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">Code Playback</h1>
          <span className="text-sm text-muted-foreground">
            {data.count} events • {(totalMs / 1000).toFixed(0)}s session
          </span>
        </div>
        {lastMarker && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {lastMarker}
          </span>
        )}
      </nav>

      {/* Controls */}
      <div className="flex items-center gap-4 border-b border-border bg-card px-4 py-3">
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={handleRestart}
          className="rounded-md border border-border px-4 py-1.5 text-sm font-medium hover:bg-muted"
        >
          ↺ Restart
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Speed:</span>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`rounded px-2 py-1 text-xs font-medium ${
                speed === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-12 text-right text-xs text-muted-foreground">
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          language={events.find((e) => e.language)?.language || 'python'}
          theme="vs-dark"
          onMount={(instance) => {
            editorRef.current = instance;
          }}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
