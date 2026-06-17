import Editor from '@monaco-editor/react';
import { Button } from '../ui/Button';
import type { Template } from '../../types/pipeline';
import { registerMonacoTheme } from '../vrl/monacoTheme';

interface TemplatePreviewModalProps {
  template: Template | null;
  open: boolean;
  onClose: () => void;
  onAdd: (template: Template) => void;
}

export function TemplatePreviewModal({
  template,
  open,
  onClose,
  onAdd,
}: TemplatePreviewModalProps) {
  if (!open || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg/80" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg border border-border2 bg-bg2">
        <div className="flex items-center justify-between border-b border-border2 px-4 py-3">
          <h2 className="font-display text-lg text-text">{template.title}</h2>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => onAdd(template)}>
              Add to Pipeline
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="h-[400px] overflow-hidden">
          <Editor
            height="100%"
            language="plaintext"
            theme="vector-dark"
            value={template.source}
            beforeMount={registerMonacoTheme}
            options={{
              readOnly: true,
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}
