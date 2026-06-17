import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../../api/client';
import type { PipelineGraph, Template } from '../../types/pipeline';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { TemplateCard } from './TemplateCard';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { BookTemplate } from 'lucide-react';

export function TemplateLibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<Template | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filtered = templates.filter((t) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const handleAdd = async (template: Template) => {
    setApplyingId(template.id);
    try {
      const pipeline: PipelineGraph = await api.getPipeline();
      const updated = await api.applyTemplate(template.id, pipeline);
      toast.success(`Added "${template.title}" to pipeline (${updated.nodes.length} nodes)`);
      setPreview(null);
      navigate('/builder');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply template');
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-10 w-64" />
        <Skeleton className="mb-6 h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center p-6">
        <EmptyState
          icon={<BookTemplate size={40} strokeWidth={1.25} />}
          title="Failed to load templates"
          description={error}
          action={{ label: 'Retry', onClick: () => void loadTemplates() }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-text">Template Library</h1>
        <p className="mt-1 text-sm text-text2">Prebuilt VRL transform templates from the backend</p>
      </div>

      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search by title or tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search templates"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onPreview={setPreview}
            onAdd={(t) => void handleAdd(t)}
            loading={applyingId === template.id}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-text2">No templates match your search.</p>
      )}

      <TemplatePreviewModal
        template={preview}
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        onAdd={(t) => void handleAdd(t)}
        loading={preview ? applyingId === preview.id : false}
      />
    </div>
  );
}
