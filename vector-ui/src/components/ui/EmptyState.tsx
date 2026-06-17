import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border2 bg-bg2/50 px-8 py-16 text-center',
        className,
      )}
    >
      {icon && <div className="text-text3">{icon}</div>}
      <h3 className="font-display text-xl text-text">{title}</h3>
      <p className="max-w-md text-sm text-text2">{description}</p>
      {action && (
        <Button variant="primary" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
