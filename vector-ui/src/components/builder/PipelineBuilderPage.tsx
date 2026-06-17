import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiRequestError, isValidationResult } from '../../api/client';
import { useAppStore } from '../../stores/appStore';
import type { PipelineEdge, PipelineGraph, PipelineNode } from '../../types/pipeline';
import { PipelineCanvas } from './PipelineCanvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { GitBranch } from 'lucide-react';

let nodeCounter = 0;

function createNode(type: PipelineNode['type'], position: { x: number; y: number }): PipelineNode {
  nodeCounter += 1;
  const id = `${type}_${nodeCounter}`;
  const defaults: Record<PipelineNode['type'], Partial<PipelineNode>> = {
    source: { componentType: 'stdin', label: id, config: { type: 'stdin' } },
    transform: {
      componentType: 'remap',
      label: id,
      transformType: 'remap',
      config: { type: 'remap', source: '' },
    },
    sink: { componentType: 'console', label: id, config: { type: 'console', encoding: { codec: 'json' } } },
  };
  return { id, type, position, ...defaults[type] } as PipelineNode;
}

function emptyGraph(): PipelineGraph {
  return { name: 'default', status: 'unknown', nodes: [], edges: [] };
}

export function PipelineBuilderPage() {
  const [graph, setGraph] = useState<PipelineGraph | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);

  const isLoading = useAppStore((s) => s.isLoadingPipeline);
  const setIsLoading = useAppStore((s) => s.setIsLoadingPipeline);
  const validationErrors = useAppStore((s) => s.validationErrors);
  const setValidationErrors = useAppStore((s) => s.setValidationErrors);
  const clearValidationErrors = useAppStore((s) => s.clearValidationErrors);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useAppStore((s) => s.setSelectedNodeId);
  const updateFromPipeline = useAppStore((s) => s.updateFromPipeline);
  const setIsValidating = useAppStore((s) => s.setIsValidating);
  const setIsSavingStore = useAppStore((s) => s.setIsSaving);
  const setPipelineActions = useAppStore((s) => s.setPipelineActions);

  const loadPipeline = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.getPipeline();
      setGraph(data);
      updateFromPipeline(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load pipeline');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, updateFromPipeline]);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  const persistGraph = useCallback(
    async (nextGraph: PipelineGraph, successMessage?: string) => {
      setIsPersisting(true);
      setIsSavingStore(true);
      clearValidationErrors();
      try {
        const saved = await api.savePipeline(nextGraph);
        setGraph(saved);
        updateFromPipeline(saved);
        if (successMessage) toast.success(successMessage);
        return saved;
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 422 && isValidationResult(err.body)) {
          setValidationErrors(err.body.errors);
          toast.error(err.body.raw ?? 'Pipeline validation failed');
        } else {
          toast.error(err instanceof Error ? err.message : 'Save failed');
        }
        throw err;
      } finally {
        setIsPersisting(false);
        setIsSavingStore(false);
      }
    },
    [clearValidationErrors, setIsSavingStore, setValidationErrors, updateFromPipeline],
  );

  const selectedNode = graph?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  const handlePersistNodes = useCallback(
    async (nodes: PipelineNode[]) => {
      if (!graph) return;
      await persistGraph({ ...graph, nodes });
    },
    [graph, persistGraph],
  );

  const handlePersistEdges = useCallback(
    async (edges: PipelineEdge[]) => {
      if (!graph) return;
      await persistGraph({ ...graph, edges });
    },
    [graph, persistGraph],
  );

  const handleSaveConfig = useCallback(
    async (nodeId: string, config: Record<string, unknown>) => {
      if (!graph) return;
      const nodes = graph.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              config,
              componentType: String(config.type ?? n.componentType),
              transformType:
                n.type === 'transform' ? String(config.type ?? n.transformType) : n.transformType,
            }
          : n,
      );
      await persistGraph({ ...graph, nodes }, 'Node configuration saved');
    },
    [graph, persistGraph],
  );

  const handleAddSource = useCallback(async () => {
    const base = graph ?? emptyGraph();
    const node = createNode('source', { x: 100, y: 100 + base.nodes.length * 80 });
    await persistGraph({ ...base, nodes: [...base.nodes, node] }, 'Source node added');
  }, [graph, persistGraph]);

  const handleDeleteNodes = useCallback(
    async (nodeIds: string[]) => {
      if (!graph) return;
      const ids = new Set(nodeIds);
      const nodes = graph.nodes.filter((n) => !ids.has(n.id));
      const edges = graph.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target));
      await persistGraph({ ...graph, nodes, edges }, 'Node deleted');
    },
    [graph, persistGraph],
  );

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
        toast.error(result.raw ?? `${result.errors.length} validation error(s)`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  }, [graph, setIsValidating, clearValidationErrors, setValidationErrors]);

  const save = useCallback(async () => {
    if (!graph) return;
    await persistGraph(graph, 'Pipeline saved');
  }, [graph, persistGraph]);

  useEffect(() => {
    setPipelineActions({ validate, save });
    return () => setPipelineActions({});
  }, [validate, save, setPipelineActions]);

  if (isLoading) {
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

  if (loadError) {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center p-6">
        <EmptyState
          icon={<GitBranch size={40} strokeWidth={1.25} />}
          title="Failed to load pipeline"
          description={loadError}
          action={{ label: 'Retry', onClick: loadPipeline }}
        />
      </div>
    );
  }

  if (!graph) return null;

  return (
    <div className="relative h-[calc(100vh-3rem)]">
      {isPersisting && (
        <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full border border-border2 bg-bg2 px-3 py-1 font-body text-xs text-text2">
          Saving…
        </div>
      )}
      <PipelineCanvas
        pipelineNodes={graph.nodes}
        pipelineEdges={graph.edges}
        validationErrors={validationErrors}
        onPersistNodes={handlePersistNodes}
        onPersistEdges={handlePersistEdges}
        onDeleteNodes={handleDeleteNodes}
        onSelectNode={setSelectedNodeId}
        onAddSource={handleAddSource}
        disabled={isPersisting}
      />
      <NodeConfigPanel
        node={selectedNode}
        open={Boolean(selectedNode)}
        onClose={() => setSelectedNodeId(null)}
        onSave={handleSaveConfig}
        saving={isPersisting}
      />
    </div>
  );
}
