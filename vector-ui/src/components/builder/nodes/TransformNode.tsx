import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '../../../lib/cn';

export interface TransformNodeData {
  label: string;
  componentType: string;
  transformType?: string;
  error?: string;
  [key: string]: unknown;
}

function TransformNodeComponent({ data, selected }: NodeProps) {
  const d = data as TransformNodeData;
  const hasError = Boolean(d.error);

  return (
    <div
      className={cn(
        'min-w-[160px] rounded border border-border2 bg-bg2 px-3 py-2 shadow-sm',
        selected && 'ring-2 ring-accent/40',
        hasError && 'border-red ring-2 ring-red/50',
      )}
      title={d.error}
      tabIndex={0}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-border-strong !bg-text2"
      />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-xs text-text3">transform</div>
          <div className="font-mono text-sm font-medium text-text">{d.label}</div>
        </div>
        {d.transformType && (
          <span className="shrink-0 rounded bg-bg3 px-1.5 py-0.5 font-mono text-[10px] text-accent">
            {d.transformType}
          </span>
        )}
      </div>
      {hasError && (
        <p className="mt-1 font-mono text-[10px] text-red">{d.error}</p>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-border-strong !bg-accent"
      />
    </div>
  );
}

export const TransformNode = memo(TransformNodeComponent);
