import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { getSchemaForNodeKind } from '../../lib/nodeSchemas';
import type { PipelineNode } from '../../types/pipeline';
import { SchemaForm } from './SchemaForm';
import { Button } from '../ui/Button';

interface NodeConfigPanelProps {
  node: PipelineNode | null;
  open: boolean;
  onClose: () => void;
  onSave: (nodeId: string, config: Record<string, unknown>) => Promise<void>;
  saving?: boolean;
}

export function NodeConfigPanel({ node, open, onClose, onSave, saving }: NodeConfigPanelProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (node) {
      setDraft(node.config);
    }
  }, [node]);

  if (!open || !node) return null;

  const schema = getSchemaForNodeKind(node.type);

  const handleSave = async () => {
    await onSave(node.id, draft);
  };

  return (
    <>
      <div className="fixed inset-0 z-30 bg-bg/50 lg:hidden" onClick={onClose} aria-hidden />
      <aside
        className={cn(
          'fixed right-0 top-12 z-40 flex h-[calc(100vh-3rem)] w-full max-w-md flex-col border-l border-border2 bg-bg2 shadow-xl',
          'transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-label="Node configuration"
      >
        <div className="flex items-center justify-between border-b border-border2 px-4 py-3">
          <div>
            <h2 className="font-body text-sm font-medium text-text">Node Config</h2>
            <p className="font-mono text-xs text-text2">{node.label}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-text2 hover:bg-bg3 hover:text-text"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <SchemaForm schema={schema} values={draft} onChange={setDraft} />
        </div>

        <div className="border-t border-border2 p-4">
          <Button variant="primary" className="w-full" loading={saving} onClick={() => void handleSave()}>
            Save Configuration
          </Button>
        </div>
      </aside>
    </>
  );
}
