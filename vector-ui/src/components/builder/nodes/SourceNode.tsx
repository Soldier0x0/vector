import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '../../../lib/cn';

export interface SourceNodeData {
  label: string;
  componentType: string;
  error?: string;
  [key: string]: unknown;
}

function SourceNodeComponent({ data, selected }: NodeProps) {
  const d = data as SourceNodeData;
  const hasError = Boolean(d.error);

  return (
    <div
      className={cn(
        'min-w-[160px] rounded border border-border2 bg-bg2 pl-0 pr-3 py-2 shadow-sm',
        'border-l-[3px] border-l-accent',
        selected && 'ring-2 ring-accent/40',
        hasError && 'border-red ring-2 ring-red/50',
      )}
      title={d.error}
      tabIndex={0}
    >
      <div className="px-3">
        <div className="font-mono text-xs text-text3">source</div>
        <div className="font-mono text-sm font-medium text-text">{d.label}</div>
        <div className="font-mono text-[10px] text-text2">{d.componentType}</div>
      </div>
      {hasError && (
        <p className="mt-1 px-3 font-mono text-[10px] text-red">{d.error}</p>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-border-strong !bg-accent"
      />
    </div>
  );
}

export const SourceNode = memo(SourceNodeComponent);
