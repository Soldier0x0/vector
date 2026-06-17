import type { Template } from '../types/pipeline';

export const templates: Template[] = [
  {
    id: 'redact-ssn',
    title: 'Redact SSN',
    description: 'Mask Social Security numbers in log messages using VRL replace.',
    tags: ['pii', 'redaction', 'compliance'],
    source: `# Redact SSN patterns (XXX-XX-XXXX)
if exists(.message) {
  .message = replace(string!(.message), r'\\b\\d{3}-\\d{2}-\\d{4}\\b', "[REDACTED]")
}
`,
  },
  {
    id: 'mitre-tag-enrichment',
    title: 'MITRE Tag Enrichment',
    description: 'Add MITRE ATT&CK technique tags based on event fields for SIEM correlation.',
    tags: ['security', 'enrichment', 'mitre'],
    source: `# MITRE ATT&CK tag enrichment
.attack = {}
if exists(.technique_id) {
  .attack.technique_id = .technique_id
  .tags = push(array!(.tags) ?? [], "mitre:" + string!(.technique_id))
}
if exists(.tactic) {
  .attack.tactic = .tactic
}
`,
  },
  {
    id: 'parse-json-logs',
    title: 'Parse JSON Logs',
    description: 'Parse nested JSON from the message field and merge into the event root.',
    tags: ['parsing', 'json'],
    source: `# Parse JSON from message field
parsed, err = parse_json(string!(.message))
if err == null {
  . = merge(., parsed)
  del(.message)
}
`,
  },
  {
    id: 'geoip-enrichment',
    title: 'GeoIP Enrichment',
    description: 'Extract client IP and prepare fields for GeoIP lookup enrichment table.',
    tags: ['enrichment', 'geoip', 'network'],
    source: `# Prepare IP for GeoIP enrichment
if exists(.client_ip) {
  .geoip = { "ip": .client_ip }
} else if exists(.remote_addr) {
  .geoip = { "ip": .remote_addr }
}
`,
  },
  {
    id: 'drop-debug-events',
    title: 'Drop Debug Events',
    description: 'Filter out debug-level log events to reduce noise in production pipelines.',
    tags: ['filter', 'noise-reduction'],
    source: `# Drop debug events — use as filter transform condition
.level != "debug" && .severity != "debug"
`,
  },
  {
    id: 'normalize-timestamps',
    title: 'Normalize Timestamps',
    description: 'Coalesce timestamp fields and ensure ISO 8601 format on .timestamp.',
    tags: ['timestamps', 'normalization'],
    source: `# Normalize timestamp fields
if !exists(.timestamp) {
  if exists(.@timestamp) {
    .timestamp = ."@timestamp"
  } else if exists(.time) {
    .timestamp = .time
  } else {
    .timestamp = now()
  }
}
`,
  },
];
