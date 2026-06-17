import type {
  AuditEntry,
  MetricsMessage,
  PipelineGraph,
  Template,
  ValidationResult,
  VrlTestRequest,
  VrlTestResponse,
} from '../types/pipeline';

const BASE = '/api';

export class ApiRequestError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    throw new ApiRequestError(
      typeof body === 'object' && body && 'error' in body
        ? String((body as { error: string }).error)
        : text || `Request failed: ${res.status}`,
      res.status,
      body,
    );
  }

  if (res.status === 204 || body === undefined) {
    return undefined as T;
  }

  return body as T;
}

export const api = {
  getPipeline: () => request<PipelineGraph>('/pipeline'),

  savePipeline: (graph: PipelineGraph) =>
    request<PipelineGraph>('/pipeline', {
      method: 'POST',
      body: JSON.stringify(graph),
    }),

  validatePipeline: (graph: PipelineGraph) =>
    request<ValidationResult>('/pipeline/validate', {
      method: 'POST',
      body: JSON.stringify(graph),
    }),

  testVrl: (payload: VrlTestRequest) =>
    request<VrlTestResponse>('/vrl/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTemplates: () => request<Template[]>('/templates'),

  applyTemplate: (templateId: string, targetPipeline: PipelineGraph) =>
    request<PipelineGraph>(`/templates/${encodeURIComponent(templateId)}/apply`, {
      method: 'POST',
      body: JSON.stringify({ targetPipeline }),
    }),

  getAuditLog: (params?: { limit?: number; before?: string }) => {
    const search = new URLSearchParams();
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.before) search.set('before', params.before);
    const qs = search.toString();
    return request<AuditEntry[]>(`/audit${qs ? `?${qs}` : ''}`);
  },

  health: () => request<{ status: string }>('/health'),
};

export function getMetricsWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/metrics`;
}

export type { MetricsMessage };

export function isValidationResult(body: unknown): body is ValidationResult {
  return (
    typeof body === 'object' &&
    body !== null &&
    'valid' in body &&
    'errors' in body
  );
}
