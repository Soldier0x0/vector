import type { NodeSchema } from '../types/pipeline';

export const nodeSchemas: Record<string, NodeSchema> = {
  source: {
    type: 'object',
    title: 'Source Configuration',
    required: ['type'],
    properties: {
      type: {
        type: 'string',
        title: 'Source Type',
        enum: ['file', 'stdin', 'http_server', 'kafka', 'syslog'],
      },
      include: {
        type: 'string',
        title: 'Include Pattern',
        description: 'Glob pattern for file sources',
      },
      address: {
        type: 'string',
        title: 'Listen Address',
        description: 'Bind address for network sources',
        default: '0.0.0.0:8080',
      },
      topic: {
        type: 'string',
        title: 'Kafka Topic',
      },
    },
  },
  transform: {
    type: 'object',
    title: 'Transform Configuration',
    required: ['type'],
    properties: {
      type: {
        type: 'string',
        title: 'Transform Type',
        enum: ['remap', 'filter', 'route', 'reduce', 'dedupe'],
      },
      inputs: {
        type: 'string',
        title: 'Inputs',
        description: 'Comma-separated input component names',
      },
      source: {
        type: 'string',
        title: 'VRL Source',
        description: 'VRL program source (for remap transforms)',
      },
      condition: {
        type: 'string',
        title: 'Condition',
        description: 'Filter condition expression',
      },
    },
  },
  sink: {
    type: 'object',
    title: 'Sink Configuration',
    required: ['type'],
    properties: {
      type: {
        type: 'string',
        title: 'Sink Type',
        enum: ['console', 'file', 'http', 'kafka', 'loki', 'prometheus_remote_write'],
      },
      inputs: {
        type: 'string',
        title: 'Inputs',
        description: 'Comma-separated input component names',
      },
      path: {
        type: 'string',
        title: 'Output Path',
      },
      uri: {
        type: 'string',
        title: 'Endpoint URI',
      },
      encoding: {
        type: 'string',
        title: 'Encoding',
        enum: ['json', 'text', 'ndjson'],
        default: 'json',
      },
    },
  },
};

export function getSchemaForNodeKind(kind: string): NodeSchema {
  return nodeSchemas[kind] ?? nodeSchemas.transform;
}
