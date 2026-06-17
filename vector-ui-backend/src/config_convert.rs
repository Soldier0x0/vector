use std::collections::{HashMap, HashSet};

use anyhow::{Context, Result};
use serde_json::{json, Map, Value};
use toml::Value as TomlValue;

use crate::models::{PipelineEdge, PipelineGraph, PipelineNode, Position, UiMetadata};

const COMPONENT_SECTIONS: [(&str, &str); 3] = [
    ("sources", "source"),
    ("transforms", "transform"),
    ("sinks", "sink"),
];

pub fn toml_to_graph(toml_str: &str, ui: &UiMetadata) -> Result<PipelineGraph> {
    let trimmed = toml_str.trim();
    if trimmed.is_empty() {
        return Ok(PipelineGraph {
            name: ui.name.clone(),
            ..Default::default()
        });
    }

    let root: TomlValue = toml::from_str(trimmed).context("failed to parse TOML config")?;
    let table = root
        .as_table()
        .context("config root must be a TOML table")?;

    let mut nodes = Vec::new();
    let mut index = 0usize;

    for (section, kind) in COMPONENT_SECTIONS {
        let Some(section_table) = table.get(section).and_then(|v| v.as_table()) else {
            continue;
        };

        for (id, component) in section_table {
            let component_table = component
                .as_table()
                .with_context(|| format!("{section}.{id} must be a table"))?;

            let component_type = component_table
                .get("type")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string();

            let mut config = Map::new();
            for (key, value) in component_table {
                config.insert(key.clone(), toml_value_to_json(value));
            }

            let position = ui.positions.get(id).cloned().unwrap_or_else(|| {
                default_position(kind, index)
            });

            nodes.push(PipelineNode {
                id: id.clone(),
                kind: kind.to_string(),
                component_type: component_type.clone(),
                label: id.clone(),
                config: Value::Object(config),
                position,
                transform_type: if kind == "transform" {
                    Some(component_type)
                } else {
                    None
                },
            });
            index += 1;
        }
    }

    let edges = edges_from_nodes(&nodes);

    Ok(PipelineGraph {
        name: ui.name.clone(),
        status: "unknown".to_string(),
        nodes,
        edges,
    })
}

pub fn graph_to_toml(graph: &PipelineGraph, preserve: Option<&TomlValue>) -> Result<String> {
    let mut root = preserve
        .and_then(|v| v.as_table().cloned())
        .unwrap_or_default();

    root.remove("sources");
    root.remove("transforms");
    root.remove("sinks");

    let mut sources = toml::map::Map::new();
    let mut transforms = toml::map::Map::new();
    let mut sinks = toml::map::Map::new();

    let inputs_map = inputs_from_edges(graph);

    for node in &graph.nodes {
        let mut table = json_object_to_toml_table(node.config.as_object())?;
        if let Some(component_type) = table.get("type").cloned() {
            table.insert("type".to_string(), component_type);
        } else {
            table.insert("type".to_string(), TomlValue::String(node.component_type.clone()));
        }

        if node.kind != "source" {
            if let Some(inputs) = inputs_map.get(&node.id) {
                let arr = inputs
                    .iter()
                    .map(|s| TomlValue::String(s.clone()))
                    .collect::<Vec<_>>();
                table.insert("inputs".to_string(), TomlValue::Array(arr));
            }
        }

        let target = match node.kind.as_str() {
            "source" => &mut sources,
            "transform" => &mut transforms,
            "sink" => &mut sinks,
            other => anyhow::bail!("unknown node kind: {other}"),
        };
        target.insert(node.id.clone(), TomlValue::Table(table));
    }

    if !sources.is_empty() {
        root.insert("sources".to_string(), TomlValue::Table(sources));
    }
    if !transforms.is_empty() {
        root.insert("transforms".to_string(), TomlValue::Table(transforms));
    }
    if !sinks.is_empty() {
        root.insert("sinks".to_string(), TomlValue::Table(sinks));
    }

    toml::to_string_pretty(&TomlValue::Table(root)).context("failed to serialize TOML")
}

pub fn ui_metadata_from_graph(graph: &PipelineGraph) -> UiMetadata {
    let positions = graph
        .nodes
        .iter()
        .map(|n| (n.id.clone(), n.position.clone()))
        .collect();
    UiMetadata {
        name: graph.name.clone(),
        positions,
    }
}

pub fn diff_graphs(before: &PipelineGraph, after: &PipelineGraph) -> (Vec<String>, Vec<String>, Vec<String>) {
    let before_ids: HashSet<_> = before.nodes.iter().map(|n| n.id.as_str()).collect();
    let after_ids: HashSet<_> = after.nodes.iter().map(|n| n.id.as_str()).collect();

    let nodes_added: Vec<String> = after
        .nodes
        .iter()
        .filter(|n| !before_ids.contains(n.id.as_str()))
        .map(|n| n.id.clone())
        .collect();

    let nodes_removed: Vec<String> = before
        .nodes
        .iter()
        .filter(|n| !after_ids.contains(n.id.as_str()))
        .map(|n| n.id.clone())
        .collect();

    let before_map: HashMap<_, _> = before.nodes.iter().map(|n| (&n.id, n)).collect();
    let mut nodes_modified = Vec::new();
    for node in &after.nodes {
        if let Some(prev) = before_map.get(&node.id) {
            let prev_json = serde_json::to_string(&prev.config).unwrap_or_default();
            let next_json = serde_json::to_string(&node.config).unwrap_or_default();
            if prev_json != next_json || prev.component_type != node.component_type {
                nodes_modified.push(node.id.clone());
            }
        }
    }

    (nodes_added, nodes_removed, nodes_modified)
}

fn edges_from_nodes(nodes: &[PipelineNode]) -> Vec<PipelineEdge> {
    let mut edges = Vec::new();
    let node_ids: HashSet<_> = nodes.iter().map(|n| n.id.as_str()).collect();

    for node in nodes {
        if node.kind == "source" {
            continue;
        }
        let inputs = extract_inputs(&node.config);
        for source in inputs {
            if node_ids.contains(source.as_str()) {
                edges.push(PipelineEdge {
                    id: format!("{}->{}", source, node.id),
                    source,
                    target: node.id.clone(),
                });
            }
        }
    }
    edges
}

fn inputs_from_edges(graph: &PipelineGraph) -> HashMap<String, Vec<String>> {
    let mut map: HashMap<String, Vec<String>> = HashMap::new();
    for edge in &graph.edges {
        map.entry(edge.target.clone())
            .or_default()
            .push(edge.source.clone());
    }
    for inputs in map.values_mut() {
        inputs.sort();
        inputs.dedup();
    }
    map
}

fn extract_inputs(config: &Value) -> Vec<String> {
    match config.get("inputs") {
        Some(Value::Array(arr)) => arr
            .iter()
            .filter_map(|v| v.as_str().map(str::to_string))
            .collect(),
        Some(Value::String(s)) => s
            .split(',')
            .map(|part| part.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect(),
        _ => Vec::new(),
    }
}

fn default_position(kind: &str, index: usize) -> Position {
    let x = match kind {
        "source" => 80.0,
        "transform" => 340.0,
        "sink" => 600.0,
        _ => 200.0,
    };
    Position {
        x,
        y: 120.0 + (index as f64 * 90.0),
    }
}

fn toml_value_to_json(value: &TomlValue) -> Value {
    match value {
        TomlValue::String(s) => Value::String(s.clone()),
        TomlValue::Integer(i) => json!(*i),
        TomlValue::Float(f) => json!(*f),
        TomlValue::Boolean(b) => Value::Bool(*b),
        TomlValue::Array(arr) => Value::Array(arr.iter().map(toml_value_to_json).collect()),
        TomlValue::Table(table) => {
            let mut map = Map::new();
            for (k, v) in table {
                map.insert(k.clone(), toml_value_to_json(v));
            }
            Value::Object(map)
        }
        TomlValue::Datetime(dt) => Value::String(dt.to_string()),
    }
}

fn json_object_to_toml_table(obj: Option<&Map<String, Value>>) -> Result<toml::map::Map<String, TomlValue>> {
    let mut table = toml::map::Map::new();
    if let Some(obj) = obj {
        for (key, value) in obj {
            if key == "inputs" {
                continue;
            }
            table.insert(key.clone(), json_value_to_toml(value)?);
        }
    }
    Ok(table)
}

fn json_value_to_toml(value: &Value) -> Result<TomlValue> {
    match value {
        Value::Null => Ok(TomlValue::String(String::new())),
        Value::Bool(b) => Ok(TomlValue::Boolean(*b)),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(TomlValue::Integer(i))
            } else if let Some(f) = n.as_f64() {
                Ok(TomlValue::Float(f))
            } else {
                Ok(TomlValue::String(n.to_string()))
            }
        }
        Value::String(s) => Ok(TomlValue::String(s.clone())),
        Value::Array(arr) => {
            let mut out = Vec::with_capacity(arr.len());
            for item in arr {
                out.push(json_value_to_toml(item)?);
            }
            Ok(TomlValue::Array(out))
        }
        Value::Object(map) => {
            let mut table = toml::map::Map::new();
            for (k, v) in map {
                table.insert(k.clone(), json_value_to_toml(v)?);
            }
            Ok(TomlValue::Table(table))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip_simple_pipeline() {
        let toml = r#"
[api]
enabled = true
address = "127.0.0.1:8686"

[sources.in]
type = "stdin"

[transforms.parse]
type = "remap"
inputs = ["in"]
source = ".message = downcase(string!(.message))"

[sinks.out]
type = "console"
inputs = ["parse"]
encoding.codec = "json"
"#;

        let ui = UiMetadata::default();
        let graph = toml_to_graph(toml, &ui).unwrap();
        assert_eq!(graph.nodes.len(), 3);
        assert_eq!(graph.edges.len(), 2);

        let preserve: TomlValue = toml::from_str(toml).unwrap();
        let out = graph_to_toml(&graph, Some(&preserve)).unwrap();
        let graph2 = toml_to_graph(&out, &ui_metadata_from_graph(&graph)).unwrap();
        assert_eq!(graph2.nodes.len(), 3);
        assert!(out.contains("[api]"));
    }
}
