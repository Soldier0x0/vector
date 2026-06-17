import type { Template } from '../../types/pipeline';
import { Button } from '../ui/Button';

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onAdd: (template: Template) => void;
}

export function TemplateCard({ template, onPreview, onAdd }: TemplateCardProps) {
  return (
    <article className="flex flex-col rounded-lg border border-border2 bg-bg2 p-4">
      <h3 className="font-display text-lg text-text">{template.title}</h3>
      <p className="mt-1 flex-1 text-sm text-text2">{template.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {template.tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-bg3 px-2 py-0.5 font-mono text-[10px] text-text3"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={() => onPreview(template)}>
          Preview
        </Button>
        <Button variant="primary" onClick={() => onAdd(template)}>
          Add to Pipeline
        </Button>
      </div>
    </article>
  );
}
