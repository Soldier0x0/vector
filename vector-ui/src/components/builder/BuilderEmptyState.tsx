import { GitBranch, Plus } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';

interface BuilderEmptyStateProps {
  onAddSource: () => void;
  loading?: boolean;
}

export function BuilderEmptyState({ onAddSource, loading }: BuilderEmptyStateProps) {
  return (
    <EmptyState
      icon={<GitBranch size={40} strokeWidth={1.25} />}
      title="Start building your pipeline"
      description="Add a source node to begin. Connect transforms and sinks to define how data flows through Vector."
      action={{
        label: loading ? 'Adding…' : 'Add Source Node',
        onClick: onAddSource,
      }}
      className="absolute inset-0 m-auto h-fit max-w-lg"
    />
  );
}

export function AddNodeHint() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded border border-border2 bg-bg2/90 px-3 py-2 text-xs text-text2">
      <Plus size={14} />
      <span className="font-body">Select a node to configure · Delete with Backspace</span>
    </div>
  );
}
