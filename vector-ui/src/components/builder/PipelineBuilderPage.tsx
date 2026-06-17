import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { useAppStore } from '../../stores/appStore';
import type { PipelineEdge, PipelineGraph, PipelineNode } from '../../types/pipeline';
import { PipelineCanvas } from './PipelineCanvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { Skeleton } from '../ui/Skeleton';

const demoPipeline: PipelineGraph = {
  name: 'demo-pipeline',
  status: 'running',
  nodes: [
    {
      id: 'src-1',
      type: 'source',
      componentType: 'file',
      label: 'app_logs',
      config: { type: 'file', include: '/var/log/app/*.log' },
      position: { x: 80, y: 120 },
    },
    {
      id: 'tf-1',
      type: 'transform',
      componentType: 'remap',
      label: 'parse_json',
      transformType: 'remap',
      config: { type: 'remap', inputs: 'app_logs' },
      position: { x: 340, y: 120 },
    },
    {
      id: 'snk-1',
      type: 'sink',
      componentType: 'console',
      label: 'stdout',
      config: { type: 'console', inputs: 'parse_json', encoding: 'json' },
      position: { x: 600, y: 120 },
    },
  ],
  edges: [
    { id: 'e1', source: 'src-1', target: 'tf-1' },
    { id: 'e2', source: 'tf-1', target: 'snk-1' },
  ],
};

let nodeCounter = 4;

function createNode(type: PipelineNode['type'], position: { x: number; y: number }): PipelineNode {
  const id = `${type.slice(0, 3)}-${nodeCounter++}`;
  const defaults: Record<PipelineNode['type'], Partial<PipelineNode>> = {
    source: { componentType: 'file', label: `source_${nodeCounter}`, config: { type: 'file' } },
    transform: {
      componentType: 'remap',
      label: `transform_${nodeCounter}`,
      transformType: 'remap',
      config: { type: 'remap' },
    },
    sink: { componentType: 'console', label: `sink_${nodeCounter}`, config: { type: 'console' } },
  };
  return { id, type, position, ...defaults[type] } as PipelineNode;
}

export function PipelineBuilderPage() {
  const [graph, setGraph] = useState<PipelineGraph | null>(null);
  const isLoading = useAppStore((s) => s.isLoadingPipeline);
  const setIsLoading = useAppStore((s) => s.setIsLoadingPipeline);
  const validationErrors = useAppStore((s) => s.validationErrors);
  const setValidationErrors = useAppStore((s) => s.setValidationErrors);
  const clearValidationErrors = useAppStore((s) => s.clearValidationErrors);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);
  const updateFromPipeline = useAppStore((s) => s.updateFromPipeline);
  const setIsValidating = useAppStore((s) => s.setIsValidating);
  const setIsSaving = useAppStore((s) => s.setIsSaving);
  const setIsReloading = useAppStore((s) => s.setIsReloading);
  const setPipelineActions = useAppStore((s) => s.setPipelineActions);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await api.getPipeline();
        if (!cancelled) {
          setGraph(data);
          updateFromPipeline(data);
        }
      } catch {
        if (!cancelled) {
          setGraph(demoPipeline);
          updateFromPipeline(demoPipeline);
          toast.message('Using demo pipeline — backend unavailable');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setIsLoading, updateFromPipeline]);

  const selectedNode = graph?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  const handleNodesChange = useCallback((nodes: PipelineNode[]) => {
    setGraph((g) => (g ? { ...g, nodes } : g));
  }, []);

  const handleEdgesChange = useCallback((edges: PipelineEdge[]) => {
    setGraph((g) => (g ? { ...g, edges } : g));
  }, []);

  const handleUpdateConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setGraph((g) => {
        if (!g) return g;
        return {
          ...g,
          nodes: g.nodes.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  config,
                  componentType: String(config.type ?? n.componentType),
                  transformType:
                    n.type === 'transform' ? String(config.type ?? n.transformType) : n.transformType,
                }
              : n,
          ),
        };
      });
      clearValidationErrors();
    },
    [clearValidationErrors],
  );

  const handleAddSource = useCallback(() => {
    setGraph((g) => {
      const base = g ?? { ...demoPipeline, nodes: [], edges: [] };
      const node = createNode('source', { x: 100, y: 100 + base.nodes.length * 80 });
      return { ...base, nodes: [...base.nodes, node] };
    });
    clearValidationErrors();
  }, [clearValidationErrors]);

  const validate = useCallback(async () => {
    if (!graph) return;
    setIsValidating(true);
    clearValidationErrors();
    try {
      const result = await api.validatePipeline(graph);
      if (result.valid) {
        toast.success('Pipeline validation passed');
      } else {
        setValidationErrors(result.errors);
        toast.error(`${result.errors.length} validation error(s)`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  }, [graph, setIsValidating, clearValidationErrors, setValidationErrors]);

  const save = useCallback(async () => {
    if (!graph) return;
    setIsSaving(true);
    try {
      await api.savePipeline(graph);
      toast.success('Pipeline saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [graph, setIsSaving]);

  const reload = useCallback(async () => {
    setIsReloading(true);
    updateFromPipeline({ ...(graph ?? demoPipeline), status: 'reloading' });
    try {
      await api.reloadPipeline();
      toast.success('Pipeline reload initiated');
      updateFromPipeline({ ...(graph ?? demoPipeline), status: 'running' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reload failed');
      updateFromPipeline({ ...(graph ?? demoPipeline), status: 'error' });
    } finally {
      setIsReloading(false);
    }
  }, [graph, setIsReloading, updateFromPipeline]);

  useEffect(() => {
    setPipelineActions({ validate, save, reload });
    return () => setPipelineActions({});
  }, [validate, save, reload, setPipelineActions]);

  if (isLoading || !graph) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-1 gap-4">
          <Skeleton className="h-32 w-40" />
          <Skeleton className="h-32 w-40" />
          <Skeleton className="h-32 w-40" />
        </div>
        <Skeleton className="flex-1" />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-3rem)]">
      <PipelineCanvas
        pipelineNodes={graph.nodes}
        pipelineEdges={graph.edges}
        validationErrors={validationErrors}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onSelectNode={setSelectedNodeId}
        onAddSource={handleAddSource}
      />
      <NodeConfigPanel
        node={selectedNode}
        open={Boolean(selectedNode)}
        onClose={() => setSelectedNodeId(null)}
        onUpdate={handleUpdateConfig}
      />
    </div>
  );
}