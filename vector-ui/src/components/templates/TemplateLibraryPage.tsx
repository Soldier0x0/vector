import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../../api/client';
import { templates as localTemplates } from '../../lib/templates';
import type { Template } from '../../types/pipeline';
import { Input } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { TemplateCard } from './TemplateCard';
import { TemplatePreviewModal } from './TemplatePreviewModal';

export function TemplateLibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<Template | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.getTemplates();
        setTemplates(data);
      } catch {
        setTemplates(localTemplates);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [templates, query]);

  const handleAdd = (template: Template) => {
    toast.success(`Added "${template.title}" — configure in Pipeline Builder`);
    setPreview(null);
    navigate('/builder');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-text">Template Library</h1>
        <p className="mt-1 text-sm text-text2">Prebuilt VRL transform templates</p>
      </div>

      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search by title or tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search templates"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={setPreview}
              onAdd={handleAdd}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-text2">No templates match your search.</p>
      )}

      <TemplatePreviewModal
        template={preview}
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        onAdd={handleAdd}
      />
    </div>
  );
}
