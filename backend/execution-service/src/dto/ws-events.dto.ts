// Client -> Server events

export interface WsExecuteProjectPayload {
  files: { filePath: string; content: string }[];
  language: string;
  entryCommand: string;
  problemId?: string;
  stdin?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

export interface WsExecuteCodePayload {
  code: string;
  language: string;
  stdin?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

// Server -> Client events

export interface WsExecutionStarted {
  executionId: string;
}

export interface WsExecutionOutput {
  executionId: string;
  stream: 'stdout' | 'stderr';
  data: string;
}

export interface WsExecutionCompleted {
  executionId: string;
  status: string;
  exitCode?: number;
  executionTimeMs?: number;
  memoryUsageKb?: number;
  error?: string;
}

export interface WsExecutionError {
  executionId: string;
  message: string;
}
