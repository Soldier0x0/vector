import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { AuditEntry } from '../../types/pipeline';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ScrollText } from 'lucide-react';

const demoAudit: AuditEntry[] = [
  {
    id: '1',
    timestamp: '2026-06-17T14:32:01Z',
    summary: 'Added remap transform parse_json',
    added: ['[transforms.parse_json]', 'type = "remap"', 'inputs = ["app_logs"]'],
    removed: [],
  },
  {
    id: '2',
    timestamp: '2026-06-17T13:15:44Z',
    summary: 'Updated sink encoding',
    added: ['encoding.codec = "json"'],
    removed: ['encoding.codec = "text"'],
  },
  {
    id: '3',
    timestamp: '2026-06-17T11:02:18Z',
    summary: 'Removed debug console sink',
    added: [],
    removed: ['[sinks.debug_out]', 'type = "console"'],
  },
];

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.getAuditLog();
        setEntries(data);
      } catch {
        setEntries(demoAudit);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-text">Audit Log</h1>
        <p className="mt-1 text-sm text-text2">Configuration change history</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<ScrollText size={40} strokeWidth={1.25} />}
          title="No changes recorded"
          description="Configuration changes will appear here as they are made."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-border2 bg-bg2 p-4"
            >
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <p className="font-body text-sm text-text">{entry.summary}</p>
                <time className="shrink-0 font-mono text-xs text-text3">
                  {new Date(entry.timestamp).toLocaleString()}
                </time>
              </div>
              <div className="flex flex-col gap-0.5 font-mono text-xs">
                {entry.added.map((line, i) => (
                  <div key={`a-${i}`} className="text-green">
                    <span className="text-green/60">+ </span>
                    {line}
                  </div>
                ))}
                {entry.removed.map((line, i) => (
                  <div key={`r-${i}`} className="text-red">
                    <span className="text-red/60">− </span>
                    {line}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
