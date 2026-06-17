import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SourceNode } from './nodes/SourceNode';
import { TransformNode } from './nodes/TransformNode';
import { SinkNode } from './nodes/SinkNode';
import { BuilderEmptyState } from './BuilderEmptyState';
import type { PipelineEdge, PipelineNode, ValidationError } from '../../types/pipeline';

const nodeTypes = {
  source: SourceNode,
  transform: TransformNode,
  sink: SinkNode,
};

function toFlowNode(node: PipelineNode, errors: ValidationError[]): Node {
  const err = errors.find((e) => e.nodeId === node.id);
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      label: node.label,
      componentType: node.componentType,
      transformType: node.transformType,
      error: err?.message,
    },
  };
}

function toFlowEdge(edge: PipelineEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    style: { stroke: 'var(--border2)' },
  };
}

interface PipelineCanvasProps {
  pipelineNodes: PipelineNode[];
  pipelineEdges: PipelineEdge[];
  validationErrors: ValidationError[];
  onPersistNodes: (nodes: PipelineNode[]) => Promise<void>;
  onPersistEdges: (edges: PipelineEdge[]) => Promise<void>;
  onDeleteNodes: (nodeIds: string[]) => Promise<void>;
  onSelectNode: (nodeId: string | null) => void;
  onAddSource: () => Promise<void>;
  disabled?: boolean;
}

export function PipelineCanvas({
  pipelineNodes,
  pipelineEdges,
  validationErrors,
  onPersistNodes,
  onPersistEdges,
  onDeleteNodes,
  onSelectNode,
  onAddSource,
  disabled,
}: PipelineCanvasProps) {
  const initialNodes = useMemo(
    () => pipelineNodes.map((n) => toFlowNode(n, validationErrors)),
    [pipelineNodes, validationErrors],
  );
  const initialEdges = useMemo(
    () => pipelineEdges.map(toFlowEdge),
    [pipelineEdges],
  );

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(pipelineNodes.map((n) => toFlowNode(n, validationErrors)));
  }, [pipelineNodes, validationErrors, setNodes]);

  useEffect(() => {
    setEdges(pipelineEdges.map(toFlowEdge));
  }, [pipelineEdges, setEdges]);

  const mergePositions = useCallback(
    (flowNodes: Node[]) =>
      pipelineNodes.map((pn) => {
        const fn = flowNodes.find((n) => n.id === pn.id);
        return fn ? { ...pn, position: fn.position } : pn;
      }),
    [pipelineNodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (disabled) return;
      const nextEdges = addEdge(
        { ...connection, style: { stroke: 'var(--border2)' } },
        edges,
      );
      const pipelineEdgeList = nextEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      }));
      setEdges(nextEdges);
      onPersistEdges(pipelineEdgeList).catch(() => {
        setEdges(pipelineEdges.map(toFlowEdge));
      });
    },
    [disabled, edges, onPersistEdges, pipelineEdges, setEdges],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selected }: OnSelectionChangeParams) => {
      onSelectNode(selected[0]?.id ?? null);
    },
    [onSelectNode],
  );

  const onNodeDragStop = useCallback(() => {
    if (disabled) return;
    const updated = mergePositions(nodes);
    onPersistNodes(updated).catch(() => {
      setNodes(pipelineNodes.map((n) => toFlowNode(n, validationErrors)));
    });
  }, [
    disabled,
    mergePositions,
    nodes,
    onPersistNodes,
    pipelineNodes,
    setNodes,
    validationErrors,
  ]);

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (disabled) return;
      onDeleteNodes(deleted.map((n) => n.id)).catch(() => {
        setNodes(pipelineNodes.map((n) => toFlowNode(n, validationErrors)));
        setEdges(pipelineEdges.map(toFlowEdge));
      });
    },
    [disabled, onDeleteNodes, pipelineNodes, pipelineEdges, setNodes, setEdges, validationErrors],
  );

  const isEmpty = pipelineNodes.length === 0;

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChangeInternal}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        deleteKeyCode={disabled ? null : ['Backspace', 'Delete']}
        nodesDraggable={!disabled}
        nodesConnectable={!disabled}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-bg"
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeColor="var(--border2)"
          nodeColor="var(--bg3)"
          maskColor="rgba(10, 10, 8, 0.75)"
        />
      </ReactFlow>

      {isEmpty && (
        <BuilderEmptyState onAddSource={() => void onAddSource()} loading={disabled} />
      )}
    </div>
  );
}
