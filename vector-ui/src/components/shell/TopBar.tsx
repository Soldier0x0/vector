import { Search } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/appStore';

interface TopBarProps {
  showActions?: boolean;
  onValidate?: () => void;
  onSave?: () => void;
}

export function TopBar({
  showActions = false,
  onValidate,
  onSave,
}: TopBarProps) {
  const pipelineName = useAppStore((s) => s.pipelineName);
  const pipelineStatus = useAppStore((s) => s.pipelineStatus);
  const isValidating = useAppStore((s) => s.isValidating);
  const isSaving = useAppStore((s) => s.isSaving);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg px-4">
      <div className="flex items-center gap-4">
        <StatusBadge name={pipelineName} status={pipelineStatus} />
      </div>

      <div className="flex items-center gap-2">
        {showActions && (
          <>
            <Button variant="secondary" loading={isValidating} onClick={onValidate}>
              Validate
            </Button>
            <Button variant="secondary" loading={isSaving} onClick={onSave}>
              Save
            </Button>
          </>
        )}

        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 rounded border border-border2 bg-bg2 px-3 py-1.5 font-body text-xs text-text2 hover:border-border-strong hover:text-text"
          aria-label="Open command palette"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Command</span>
          <kbd className="rounded bg-bg3 px-1.5 py-0.5 font-mono text-[10px] text-text3">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}
