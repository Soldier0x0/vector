import type { PipelineStatus } from '../../types/pipeline';
import { cn } from '../../lib/cn';

const statusConfig: Record<
  PipelineStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  running: { label: 'Running', dotClass: 'bg-green', textClass: 'text-green' },
  reloading: { label: 'Reloading', dotClass: 'bg-amber', textClass: 'text-amber' },
  error: { label: 'Error', dotClass: 'bg-red', textClass: 'text-red' },
  unknown: { label: 'Unknown', dotClass: 'bg-text3', textClass: 'text-text2' },
};

interface StatusBadgeProps {
  status: PipelineStatus;
  name: string;
}

export function StatusBadge({ status, name }: StatusBadgeProps) {
  const cfg = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-text">{name}</span>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-border2 bg-bg3 px-2 py-0.5 text-xs font-body',
          cfg.textClass,
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dotClass)} aria-hidden />
        {cfg.label}
      </span>
    </div>
  );
}
