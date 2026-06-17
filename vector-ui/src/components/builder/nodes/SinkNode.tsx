import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '../../../lib/cn';

export interface SinkNodeData {
  label: string;
  componentType: string;
  error?: string;
  [key: string]: unknown;
}

function SinkNodeComponent({ data, selected }: NodeProps) {
  const d = data as SinkNodeData;
  const hasError = Boolean(d.error);

  return (
    <div
      className={cn(
        'min-w-[160px] rounded border border-border2 bg-bg2 pl-3 pr-0 py-2 shadow-sm',
        'border-r-[3px] border-r-green',
        selected && 'ring-2 ring-accent/40',
        hasError && 'border-red ring-2 ring-red/50',
      )}
      title={d.error}
      tabIndex={0}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-border-strong !bg-green"
      />
      <div className="px-0 pr-3">
        <div className="font-mono text-xs text-text3">sink</div>
        <div className="font-mono text-sm font-medium text-text">{d.label}</div>
        <div className="font-mono text-[10px] text-text2">{d.componentType}</div>
      </div>
      {hasError && (
        <p className="mt-1 font-mono text-[10px] text-red">{d.error}</p>
      )}
    </div>
  );
}

export const SinkNode = memo(SinkNodeComponent);
