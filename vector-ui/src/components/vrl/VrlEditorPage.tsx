import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { registerMonacoTheme } from './monacoTheme';
import { TestEventPanel } from './TestEventPanel';
import { Skeleton } from '../ui/Skeleton';

const DEFAULT_VRL = `# VRL transform
.message = downcase(string!(.message))
.timestamp = now()
`;

export function VrlEditorPage() {
  const { transformId = 'default' } = useParams();
  const [source, setSource] = useState(DEFAULT_VRL);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transformId === 'default') {
      setSource(DEFAULT_VRL);
      return;
    }
    setLoading(true);
    api
      .getPipeline()
      .then((graph) => {
        const node = graph.nodes.find((n) => n.id === transformId);
        const vrl = node?.config?.source;
        if (typeof vrl === 'string') setSource(vrl);
      })
      .catch(() => toast.error('Failed to load transform source from pipeline'))
      .finally(() => setLoading(false));
  }, [transformId]);

  const handleRun = useCallback(
    async (event: Record<string, unknown>) => {
      setTesting(true);
      setOutput(null);
      setError(null);
      try {
        const result = await api.testVrl({ source, event });
        if (result.error) {
          setError(result.line ? `Line ${result.line}: ${result.error}` : result.error);
        } else if (result.result) {
          setOutput(JSON.stringify(result.result, null, 2));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Test failed');
      } finally {
        setTesting(false);
      }
    },
    [source],
  );

  const handleSave = useCallback(async () => {
    if (transformId === 'default') {
      toast.message('Open a specific transform from the pipeline builder to save');
      return;
    }
    try {
      const graph = await api.getPipeline();
      const nodes = graph.nodes.map((n) =>
        n.id === transformId ? { ...n, config: { ...n.config, source } } : n,
      );
      await api.savePipeline({ ...graph, nodes });
      toast.success('VRL saved to pipeline');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    }
  }, [transformId, source]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3rem)] flex-col gap-4 p-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center justify-between border-b border-border2 px-4 py-2">
        <div>
          <h1 className="font-display text-lg text-text">VRL Editor</h1>
          <p className="font-mono text-xs text-text2">{transformId}</p>
        </div>
        <button
          onClick={() => void handleSave()}
          className="rounded bg-bg3 px-3 py-1.5 font-body text-sm text-text2 hover:text-text"
        >
          Save (⌘S)
        </button>
      </div>

      <Group orientation="horizontal" className="flex-1">
        <Panel defaultSize={65} minSize={40}>
          <Editor
            height="100%"
            language="plaintext"
            theme="vector-dark"
            value={source}
            onChange={(v) => setSource(v ?? '')}
            beforeMount={registerMonacoTheme}
            options={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 12 },
            }}
          />
        </Panel>
        <Separator className="w-1 bg-border2 transition-colors hover:bg-accent/50" />
        <Panel defaultSize={35} minSize={25}>
          <TestEventPanel onRun={handleRun} output={output} error={error} loading={testing} />
        </Panel>
      </Group>
    </div>
  );
}
