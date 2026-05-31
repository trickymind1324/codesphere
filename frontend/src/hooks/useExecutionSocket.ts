import { useRef, useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ExecutionCompletedResult {
  executionId: string;
  status: string;
  exitCode?: number;
  executionTimeMs?: number;
  memoryUsageKb?: number;
  error?: string;
}

interface ExecutionCallbacks {
  onStarted?: (executionId: string) => void;
  onOutput?: (stream: 'stdout' | 'stderr', data: string) => void;
  onCompleted?: (result: ExecutionCompletedResult) => void;
  onError?: (message: string) => void;
}

export function useExecutionSocket() {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef<ExecutionCallbacks>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const socket = io('/execution', {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('execution:started', (data: { executionId: string }) => {
      callbacksRef.current.onStarted?.(data.executionId);
    });

    socket.on('execution:output', (data: { executionId: string; stream: 'stdout' | 'stderr'; data: string }) => {
      callbacksRef.current.onOutput?.(data.stream, data.data);
    });

    socket.on('execution:completed', (data: ExecutionCompletedResult) => {
      callbacksRef.current.onCompleted?.(data);
    });

    socket.on('execution:error', (data: { executionId: string; message: string }) => {
      callbacksRef.current.onError?.(data.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const executeProject = useCallback((
    payload: {
      files: { filePath: string; content: string }[];
      language: string;
      entryCommand: string;
      problemId?: string;
      stdin?: string;
    },
    callbacks: ExecutionCallbacks,
  ) => {
    callbacksRef.current = callbacks;
    socketRef.current?.emit('execute:project', payload);
  }, []);

  const executeCode = useCallback((
    payload: {
      code: string;
      language: string;
      stdin?: string;
    },
    callbacks: ExecutionCallbacks,
  ) => {
    callbacksRef.current = callbacks;
    socketRef.current?.emit('execute:code', payload);
  }, []);

  const killExecution = useCallback(() => {
    socketRef.current?.emit('execute:kill');
  }, []);

  return { executeProject, executeCode, killExecution, connected };
}
