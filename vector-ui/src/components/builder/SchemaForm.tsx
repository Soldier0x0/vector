import type { JsonSchemaProperty, NodeSchema } from '../../types/pipeline';
import { cn } from '../../lib/cn';

interface SchemaFormProps {
  schema: NodeSchema;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}

export function SchemaForm({ schema, values, onChange }: SchemaFormProps) {
  const fields = Object.entries(schema.properties);

  const updateField = (key: string, value: unknown) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      {fields.map(([key, prop]) => (
        <Field
          key={key}
          name={key}
          prop={prop}
          value={values[key] ?? prop.default ?? ''}
          required={schema.required?.includes(key)}
          onChange={(v) => updateField(key, v)}
        />
      ))}
    </form>
  );
}

function Field({
  name,
  prop,
  value,
  required,
  onChange,
}: {
  name: string;
  prop: JsonSchemaProperty;
  value: unknown;
  required?: boolean;
  onChange: (v: unknown) => void;
}) {
  const label = prop.title ?? name;
  const id = `field-${name}`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-body text-xs font-medium text-text2">
        {label}
        {required && <span className="text-red"> *</span>}
      </label>
      {prop.description && (
        <p className="text-xs text-text3">{prop.description}</p>
      )}

      {prop.enum ? (
        <select
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'rounded border border-border bg-bg3 px-3 py-2 font-mono text-sm text-text',
            'focus:border-border-strong focus:outline-none',
          )}
        >
          <option value="">Select…</option>
          {prop.enum.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : prop.type === 'string' && (name === 'source' || name === 'condition') ? (
        <textarea
          id={id}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className={cn(
            'rounded border border-border bg-bg3 px-3 py-2 font-mono text-sm text-text',
            'focus:border-border-strong focus:outline-none',
          )}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'rounded border border-border bg-bg3 px-3 py-2 font-mono text-sm text-text',
            'focus:border-border-strong focus:outline-none',
          )}
        />
      )}
    </div>
  );
}
