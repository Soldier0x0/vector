import { useState } from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';

const DEFAULT_EVENT = `{
  "message": "User login from 192.168.1.1",
  "level": "info",
  "user": "alice"
}`;

interface TestEventPanelProps {
  onRun: (event: Record<string, unknown>) => Promise<void>;
  output: string | null;
  error: string | null;
  loading: boolean;
}

export function TestEventPanel({ onRun, output, error, loading }: TestEventPanelProps) {
  const [eventJson, setEventJson] = useState(DEFAULT_EVENT);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleRun = async () => {
    setParseError(null);
    try {
      const event = JSON.parse(eventJson) as Record<string, unknown>;
      await onRun(event);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  return (
    <div className="flex h-full flex-col bg-bg2">
      <div className="border-b border-border2 px-4 py-3">
        <h2 className="font-body text-sm font-medium text-text">Test Event</h2>
        <p className="text-xs text-text2">JSON input for VRL evaluation</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <textarea
          value={eventJson}
          onChange={(e) => setEventJson(e.target.value)}
          className={cn(
            'min-h-[200px] flex-1 resize-none rounded border border-border bg-bg3 p-3 font-mono text-sm text-text',
            'focus:border-border-strong focus:outline-none',
          )}
          spellCheck={false}
        />

        {(parseError || error) && (
          <p className="font-mono text-xs text-red">{parseError ?? error}</p>
        )}

        <Button variant="primary" loading={loading} onClick={handleRun}>
          Run
        </Button>

        {output && (
          <div className="flex flex-col gap-1">
            <span className="font-body text-xs font-medium text-text2">Output</span>
            <pre className="max-h-48 overflow-auto rounded border border-border bg-bg3 p-3 font-mono text-xs text-green">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
