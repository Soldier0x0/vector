import type {
  AuditEntry,
  MetricsMessage,
  PipelineGraph,
  Template,
  ValidationResult,
  VrlTestRequest,
  VrlTestResult,
} from '../types/pipeline';
import { templates as localTemplates } from '../lib/templates';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  getPipeline: () => request<PipelineGraph>('/pipeline'),

  savePipeline: (graph: PipelineGraph) =>
    request<void>('/pipeline', {
      method: 'PUT',
      body: JSON.stringify(graph),
    }),

  validatePipeline: (graph: PipelineGraph) =>
    request<ValidationResult>('/pipeline/validate', {
      method: 'POST',
      body: JSON.stringify(graph),
    }),

  reloadPipeline: () =>
    request<void>('/pipeline/reload', { method: 'POST' }),

  getVrl: (transformId: string) =>
    request<{ source: string }>(`/vrl/${encodeURIComponent(transformId)}`),

  saveVrl: (transformId: string, source: string) =>
    request<void>(`/vrl/${encodeURIComponent(transformId)}`, {
      method: 'PUT',
      body: JSON.stringify({ source }),
    }),

  testVrl: (payload: VrlTestRequest) =>
    request<VrlTestResult>('/vrl/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTemplates: async (): Promise<Template[]> => {
    try {
      return await request<Template[]>('/templates');
    } catch {
      return localTemplates;
    }
  },

  getAuditLog: () => request<AuditEntry[]>('/audit'),
};

export function getMetricsWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/metrics`;
}

export type { MetricsMessage };
