import { useCallback, useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { MetricsMessage } from '../../types/pipeline';
import { ComponentCard } from './ComponentCard';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Activity } from 'lucide-react';

export function LiveMonitorPage() {
  const [components, setComponents] = useState<MetricsMessage['components']>([]);
  const [pulseKeys, setPulseKeys] = useState<Record<string, number>>({});
  const [initialized, setInitialized] = useState(false);

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

  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/metrics`;

  const { status } = useWebSocket<MetricsMessage>({
    url: wsUrl,
    onMessage: handleMessage,
  });

  const isConnecting = status === 'connecting' && !initialized;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text">Live Monitor</h1>
          <p className="text-sm text-text2">Real-time component metrics from Vector</p>
        </div>
        {status === 'reconnecting' && (
          <span className="font-body text-sm text-amber">Reconnecting…</span>
        )}
        {status === 'connected' && (
          <span className="font-body text-sm text-green">Connected</span>
        )}
        {status === 'connecting' && !initialized && (
          <span className="font-body text-sm text-text2">Connecting…</span>
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
          description="Metrics appear once Vector is running with the API enabled and components are processing events."
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
