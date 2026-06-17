import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  Activity,
  BookTemplate,
  FileCode2,
  GitBranch,
  RefreshCw,
  Save,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { cn } from '../../lib/cn';

interface CommandPaletteProps {
  onValidate?: () => void;
  onSave?: () => void;
  onReload?: () => void;
}

export function CommandPalette({ onValidate, onSave, onReload }: CommandPaletteProps) {
  const open = useAppStore((s) => s.commandPaletteOpen);
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  const run = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-bg/70"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div className="relative mx-auto mt-[15vh] max-w-lg px-4">
        <Command
          className="overflow-hidden rounded-lg border border-border2 bg-bg2 shadow-2xl"
          label="Command palette"
        >
          <Command.Input
            placeholder="Search commands and navigation…"
            className="w-full border-b border-border2 bg-transparent px-4 py-3 font-body text-sm text-text placeholder:text-text3 focus:outline-none"
            autoFocus
          />
          <Command.List className="max-h-72 overflow-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-text2">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text3">
              <CommandItem icon={GitBranch} onSelect={() => run(() => navigate('/builder'))}>
                Pipeline Builder
              </CommandItem>
              <CommandItem icon={FileCode2} onSelect={() => run(() => navigate('/vrl/default'))}>
                VRL Editor
              </CommandItem>
              <CommandItem icon={Activity} onSelect={() => run(() => navigate('/monitor'))}>
                Live Monitor
              </CommandItem>
              <CommandItem icon={BookTemplate} onSelect={() => run(() => navigate('/templates'))}>
                Templates
              </CommandItem>
              <CommandItem icon={ScrollText} onSelect={() => run(() => navigate('/audit'))}>
                Audit Log
              </CommandItem>
            </Command.Group>

            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text3">
              {onValidate && (
                <CommandItem icon={ShieldCheck} onSelect={() => run(onValidate)}>
                  Validate Pipeline
                </CommandItem>
              )}
              {onSave && (
                <CommandItem icon={Save} onSelect={() => run(onSave)}>
                  Save Pipeline
                </CommandItem>
              )}
              {onReload && (
                <CommandItem icon={RefreshCw} onSelect={() => run(onReload)}>
                  Reload Pipeline
                </CommandItem>
              )}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

function CommandItem({
  children,
  icon: Icon,
  onSelect,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded px-2 py-2 font-body text-sm text-text2',
        'aria-selected:bg-bg3 aria-selected:text-text',
      )}
    >
      <Icon size={16} />
      {children}
    </Command.Item>
  );
}
