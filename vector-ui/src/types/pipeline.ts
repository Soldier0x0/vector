export type PipelineStatus = 'running' | 'reloading' | 'error' | 'unknown';

export type NodeKind = 'source' | 'transform' | 'sink';

export interface PipelineNode {
  id: string;
  type: NodeKind;
  componentType: string;
  label: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  transformType?: string;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
}

export interface PipelineGraph {
  name: string;
  status: PipelineStatus;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export interface ValidationError {
  nodeId: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  raw?: string;
}

export interface VrlTestRequest {
  source: string;
  event: Record<string, unknown>;
}

export interface VrlTestResponse {
  result?: Record<string, unknown>;
  error?: string;
  line?: number;
}

export interface ComponentMetric {
  id: string;
  name: string;
  throughput: number[];
  errorCount: number;
  bufferFill: number;
  timestamp: number;
}

export interface MetricsMessage {
  components: ComponentMetric[];
}

export interface Template {
  id: string;
  title: string;
  description: string;
  tags: string[];
  vrlSource: string;
}

export interface AuditEntry {
  timestamp: string;
  nodesAdded: string[];
  nodesRemoved: string[];
  nodesModified: string[];
}

export interface JsonSchemaProperty {
  type?: string;
  title?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

export interface NodeSchema {
  type: string;
  title?: string;
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}
