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
  onNodesChange: (nodes: PipelineNode[]) => void;
  onEdgesChange: (edges: PipelineEdge[]) => void;
  onSelectNode: (nodeId: string | null) => void;
  onAddSource: () => void;
}

export function PipelineCanvas({
  pipelineNodes,
  pipelineEdges,
  validationErrors,
  onNodesChange,
  onEdgesChange,
  onSelectNode,
  onAddSource,
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

  const syncNodes = useCallback(
    (flowNodes: Node[]) => {
      const updated = pipelineNodes.map((pn) => {
        const fn = flowNodes.find((n) => n.id === pn.id);
        return fn ? { ...pn, position: fn.position } : pn;
      });
      onNodesChange(updated);
    },
    [pipelineNodes, onNodesChange],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge(
          { ...connection, style: { stroke: 'var(--border2)' } },
          eds,
        );
        onEdgesChange(
          next.map((e) => ({ id: e.id, source: e.source, target: e.target })),
        );
        return next;
      });
    },
    [setEdges, onEdgesChange],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selected }: OnSelectionChangeParams) => {
      onSelectNode(selected[0]?.id ?? null);
    },
    [onSelectNode],
  );

  const onNodeDragStop = useCallback(() => {
    syncNodes(nodes);
  }, [nodes, syncNodes]);

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const ids = new Set(deleted.map((n) => n.id));
      onNodesChange(pipelineNodes.filter((n) => !ids.has(n.id)));
      onEdgesChange(
        pipelineEdges.filter((e) => !ids.has(e.source) && !ids.has(e.target)),
      );
    },
    [pipelineNodes, pipelineEdges, onNodesChange, onEdgesChange],
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
        deleteKeyCode={['Backspace', 'Delete']}
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

      {isEmpty && <BuilderEmptyState onAddSource={onAddSource} />}
    </div>
  );
}
