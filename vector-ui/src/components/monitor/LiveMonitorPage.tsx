import { useCallback, useEffect, useRef, useState } from 'react';
import { getMetricsWebSocketUrl, type MetricsMessage } from '../../api/client';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { ComponentMetric } from '../../types/pipeline';
import { ComponentCard } from './ComponentCard';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Activity } from 'lucide-react';

const demoMetrics: ComponentMetric[] = [
  {
    id: 'app_logs',
    name: 'app_logs',
    throughput: [12, 18, 15, 22, 19, 25, 21, 28],
    errorCount: 0,
    bufferFill: 23,
    timestamp: Date.now(),
  },
  {
    id: 'parse_json',
    name: 'parse_json',
    throughput: [10, 14, 16, 13, 20, 18, 22, 19],
    errorCount: 2,
    bufferFill: 67,
    timestamp: Date.now(),
  },
  {
    id: 'stdout',
    name: 'stdout',
    throughput: [8, 12, 11, 15, 14, 17, 16, 20],
    errorCount: 0,
    bufferFill: 8,
    timestamp: Date.now(),
  },
];

export function LiveMonitorPage() {
  const [components, setComponents] = useState<ComponentMetric[]>([]);
  const [pulseKeys, setPulseKeys] = useState<Record<string, number>>({});
  const [initialized, setInitialized] = useState(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMessage = useCallback((data: MetricsMessage) => {
    setComponents(data.components);
    setPulseKeys((prev) => {
      const next = { ...prev };
      for (const c of data.components) {
        next[c.id] = (prev[c.id] ?? 0) + 1;
      }
      return next;
    });
    setInitialized(true);
  }, []);

  const { status } = useWebSocket<MetricsMessage>({
    url: getMetricsWebSocketUrl(),
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (initialized) return;
    fallbackTimer.current = setTimeout(() => {
      setComponents((current) => {
        if (current.length > 0) return current;
        setPulseKeys({ app_logs: 1, parse_json: 1, stdout: 1 });
        setInitialized(true);
        return demoMetrics;
      });
    }, 2000);
    return () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, [initialized]);

  const isConnecting = status === 'connecting' && !initialized;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text">Live Monitor</h1>
          <p className="text-sm text-text2">Real-time component metrics</p>
        </div>
        {status === 'reconnecting' && (
          <span className="font-body text-sm text-amber">Reconnecting…</span>
        )}
        {status === 'connected' && (
          <span className="font-body text-sm text-green">Connected</span>
        )}
      </div>

      {isConnecting ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : components.length === 0 ? (
        <EmptyState
          icon={<Activity size={40} strokeWidth={1.25} />}
          title="No metrics yet"
          description="Waiting for component metrics from the pipeline. Ensure the backend WebSocket is running."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {components.map((metric) => (
            <ComponentCard
              key={metric.id}
              metric={metric}
              pulseKey={pulseKeys[metric.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
