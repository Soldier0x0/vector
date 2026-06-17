use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

impl Default for Position {
    fn default() -> Self {
        Self { x: 0.0, y: 0.0 }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineNode {
    pub id: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub component_type: String,
    pub label: String,
    pub config: Value,
    pub position: Position,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transform_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineEdge {
    pub id: String,
    pub source: String,
    pub target: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineGraph {
    pub name: String,
    #[serde(default = "default_status")]
    pub status: String,
    pub nodes: Vec<PipelineNode>,
    pub edges: Vec<PipelineEdge>,
}

fn default_status() -> String {
    "unknown".to_string()
}

impl Default for PipelineGraph {
    fn default() -> Self {
        Self {
            name: "default".to_string(),
            status: default_status(),
            nodes: Vec::new(),
            edges: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationError {
    pub node_id: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<ValidationError>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VrlTestRequest {
    pub source: String,
    pub event: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VrlTestResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Template {
    pub id: String,
    pub title: String,
    pub description: String,
    pub tags: Vec<String>,
    pub vrl_source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyTemplateRequest {
    pub target_pipeline: PipelineGraph,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditEntry {
    pub timestamp: String,
    pub nodes_added: Vec<String>,
    pub nodes_removed: Vec<String>,
    pub nodes_modified: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UiMetadata {
    #[serde(default = "default_pipeline_name")]
    pub name: String,
    #[serde(default)]
    pub positions: std::collections::HashMap<String, Position>,
}

fn default_pipeline_name() -> String {
    "default".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ComponentMetric {
    pub id: String,
    pub name: String,
    pub throughput: Vec<f64>,
    pub error_count: u64,
    pub buffer_fill: f64,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsMessage {
    pub components: Vec<ComponentMetric>,
}
