import { useCallback, useEffect, useRef, useState } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

interface UseWebSocketOptions<T> {
  url: string;
  onMessage: (data: T) => void;
  enabled?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket<T>({
  url,
  onMessage,
  enabled = true,
  reconnectInterval = 3000,
}: UseWebSocketOptions<T>) {
  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!enabled) return;

    setStatus((prev) => (prev === 'connected' ? prev : prev === 'disconnected' ? 'reconnecting' : 'connecting'));

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as T;
        onMessageRef.current(data);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setStatus('reconnecting');
      reconnectTimer.current = setTimeout(connect, reconnectInterval);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [url, enabled, reconnectInterval]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status };
}
