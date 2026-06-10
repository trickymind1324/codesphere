import { useRef, useState, useEffect } from 'react';
import { aiApi, SocraticMessage } from '@/api/ai.api';

interface Props {
  problemTitle: string;
  problemDescription: string;
  /** Live code from the editor so the tutor sees what the user sees. */
  getCode: () => string;
  language: string;
}

/**
 * AI Socratic Tutor chat. The tutor never writes code — it responds with
 * guiding questions only (enforced server-side in ai-service).
 */
export function SocraticTutorPanel({
  problemTitle,
  problemDescription,
  getCode,
  language,
}: Props) {
  const [messages, setMessages] = useState<SocraticMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || isThinking) return;

    setInput('');
    setError(null);
    const nextMessages: SocraticMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(nextMessages);
    setIsThinking(true);

    try {
      const { question } = await aiApi.askSocratic({
        problem_title: problemTitle,
        problem_description: problemDescription.slice(0, 10_000),
        user_code: getCode().slice(0, 20_000),
        user_language: language,
        user_message: userMessage,
        history: messages.slice(-10),
      });
      setMessages([...nextMessages, { role: 'assistant', content: question }]);
    } catch {
      setError(
        'The AI tutor is unavailable right now. Make sure the AI service is running, then try again.'
      );
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
        🦉 I won't write code for you — I'll ask questions that help you find
        the answer yourself. Tell me where you're stuck.
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Ask anything about this problem — e.g. “Why does my loop miss the
            last element?”
          </p>
        )}
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`max-w-[85%] rounded-lg p-3 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}
          >
            {m.content}
          </div>
        ))}
        {isThinking && (
          <div className="max-w-[85%] rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Thinking…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          rows={2}
          placeholder="Describe where you're stuck…"
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          onClick={handleSend}
          disabled={isThinking || !input.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
