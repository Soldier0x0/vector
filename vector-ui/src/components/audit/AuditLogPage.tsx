import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import type { AuditEntry } from '../../types/pipeline';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { ScrollText } from 'lucide-react';

export function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditLog({ limit: 50 });
      setEntries(data);
      setHasMore(data.length >= 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = async () => {
    if (!entries.length || loadingMore) return;
    setLoadingMore(true);
    try {
      const before = entries[entries.length - 1]?.timestamp;
      const data = await api.getAuditLog({ limit: 50, before });
      setEntries((prev) => [...prev, ...data]);
      setHasMore(data.length >= 50);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-10 w-48" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center p-6">
        <EmptyState
          icon={<ScrollText size={40} strokeWidth={1.25} />}
          title="Failed to load audit log"
          description={error}
          action={{ label: 'Retry', onClick: () => void loadInitial() }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-text">Audit Log</h1>
        <p className="mt-1 text-sm text-text2">Recorded pipeline configuration changes</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<ScrollText size={40} strokeWidth={1.25} />}
          title="No changes recorded"
          description="Configuration changes will appear here after you save pipeline edits."
        />
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {entries.map((entry) => (
              <li
                key={entry.timestamp}
                className="rounded-lg border border-border2 bg-bg2 p-4"
              >
                <div className="mb-2 flex items-baseline justify-between gap-4">
                  <p className="font-body text-sm text-text">{summarizeEntry(entry)}</p>
                  <time className="shrink-0 font-mono text-xs text-text3">
                    {new Date(entry.timestamp).toLocaleString()}
                  </time>
                </div>
                <div className="flex flex-col gap-0.5 font-mono text-xs">
                  {entry.nodesAdded.map((id) => (
                    <div key={`a-${id}`} className="text-green">
                      <span className="text-green/60">+ </span>
                      added {id}
                    </div>
                  ))}
                  {entry.nodesRemoved.map((id) => (
                    <div key={`r-${id}`} className="text-red">
                      <span className="text-red/60">− </span>
                      removed {id}
                    </div>
                  ))}
                  {entry.nodesModified.map((id) => (
                    <div key={`m-${id}`} className="text-accent">
                      <span className="text-accent/60">~ </span>
                      modified {id}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button variant="secondary" loading={loadingMore} onClick={() => void loadMore()}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function summarizeEntry(entry: AuditEntry): string {
  const parts: string[] = [];
  if (entry.nodesAdded.length) parts.push(`${entry.nodesAdded.length} added`);
  if (entry.nodesRemoved.length) parts.push(`${entry.nodesRemoved.length} removed`);
  if (entry.nodesModified.length) parts.push(`${entry.nodesModified.length} modified`);
  return parts.join(', ') || 'Pipeline updated';
}
