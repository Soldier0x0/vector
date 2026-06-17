use std::fs;
use std::path::Path;
use std::process::Command;

use regex::Regex;
use tempfile::NamedTempFile;

use crate::config_convert::{diff_graphs, graph_to_toml, toml_to_graph, ui_metadata_from_graph};
use crate::config::AppState;
use crate::error::{ApiError, ApiResult};
use crate::models::{PipelineGraph, UiMetadata, ValidationError, ValidationResult};

#[derive(Debug)]
pub enum SaveError {
    Validation(ValidationResult),
    Internal(String),
}

pub fn read_pipeline(state: &AppState) -> ApiResult<PipelineGraph> {
    let ui = read_ui_metadata(&state.ui_metadata_path)?;
    let toml_str = if state.config_path.exists() {
        fs::read_to_string(&state.config_path).map_err(|e| ApiError::Internal(e.to_string()))?
    } else {
        String::new()
    };

    toml_to_graph(&toml_str, &ui).map_err(|e| ApiError::Internal(e.to_string()))
}

pub fn validate_pipeline(state: &AppState, graph: &PipelineGraph) -> ApiResult<ValidationResult> {
    let preserve = read_existing_toml(&state.config_path);
    let toml = graph_to_toml(graph, preserve.as_ref())
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;
    validate_toml(state, &toml)
}

pub fn save_pipeline(state: &AppState, graph: &PipelineGraph) -> Result<PipelineGraph, SaveError> {
    let before = read_pipeline(state).unwrap_or_default();
    let preserve = read_existing_toml(&state.config_path);
    let toml = graph_to_toml(graph, preserve.as_ref())
        .map_err(|e| SaveError::Internal(e.to_string()))?;

    let validation = validate_toml(state, &toml).map_err(|e| SaveError::Internal(e.to_string()))?;
    if !validation.valid {
        return Err(SaveError::Validation(validation));
    }

    if let Some(parent) = state.config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| SaveError::Internal(e.to_string()))?;
    }

    let tmp = NamedTempFile::new_in(
        state
            .config_path
            .parent()
            .unwrap_or_else(|| Path::new(".")),
    )
    .map_err(|e| SaveError::Internal(e.to_string()))?;
    fs::write(tmp.path(), &toml).map_err(|e| SaveError::Internal(e.to_string()))?;
    fs::copy(tmp.path(), &state.config_path)
        .map_err(|e| SaveError::Internal(e.to_string()))?;

    let ui = ui_metadata_from_graph(graph);
    write_ui_metadata(&state.ui_metadata_path, &ui)
        .map_err(|e| SaveError::Internal(e.to_string()))?;

    let (nodes_added, nodes_removed, nodes_modified) = diff_graphs(&before, graph);
    if !nodes_added.is_empty() || !nodes_removed.is_empty() || !nodes_modified.is_empty() {
        crate::audit::append_entry(
            &state.audit_path,
            &nodes_added,
            &nodes_removed,
            &nodes_modified,
        )
        .map_err(|e| SaveError::Internal(e.to_string()))?;
    }

    read_pipeline(state).map_err(|e| SaveError::Internal(e.to_string()))
}

fn read_ui_metadata(path: &Path) -> ApiResult<UiMetadata> {
    if !path.exists() {
        return Ok(UiMetadata::default());
    }
    let content = fs::read_to_string(path).map_err(|e| ApiError::Internal(e.to_string()))?;
    if content.trim().is_empty() {
        return Ok(UiMetadata::default());
    }
    serde_json::from_str(&content).map_err(|e| ApiError::Internal(e.to_string()))
}

fn write_ui_metadata(path: &Path, ui: &UiMetadata) -> ApiResult<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| ApiError::Internal(e.to_string()))?;
    }
    let json = serde_json::to_string_pretty(ui).map_err(|e| ApiError::Internal(e.to_string()))?;
    fs::write(path, json).map_err(|e| ApiError::Internal(e.to_string()))
}

fn read_existing_toml(path: &Path) -> Option<toml::Value> {
    if !path.exists() {
        return None;
    }
    let content = fs::read_to_string(path).ok()?;
    if content.trim().is_empty() {
        return None;
    }
    toml::from_str(&content).ok()
}

fn validate_toml(state: &AppState, toml: &str) -> ApiResult<ValidationResult> {
    let tmp = NamedTempFile::new().map_err(|e| ApiError::Internal(e.to_string()))?;
    fs::write(tmp.path(), toml).map_err(|e| ApiError::Internal(e.to_string()))?;

    let output = Command::new(&state.vector_bin)
        .args([
            "validate",
            "--config-toml",
            tmp.path().to_str().unwrap_or_default(),
            "--skip-healthchecks",
            "--no-environment",
        ])
        .output()
        .map_err(|e| {
            ApiError::Internal(format!(
                "failed to run `{} validate`: {e}",
                state.vector_bin
            ))
        })?;

    if output.status.success() {
        return Ok(ValidationResult {
            valid: true,
            errors: Vec::new(),
            raw: None,
        });
    }

    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    let raw = if stderr.trim().is_empty() {
        stdout.to_string()
    } else {
        format!("{stdout}{stderr}")
    };

    Ok(ValidationResult {
        valid: false,
        errors: parse_validation_errors(&raw),
        raw: Some(raw),
    })
}

fn parse_validation_errors(raw: &str) -> Vec<ValidationError> {
    let component_re =
        Regex::new(r#"(?:(?:sources|transforms|sinks)\.([A-Za-z0-9_-]+)|component\s+"([^"]+)")"#)
            .unwrap();
    let mut errors = Vec::new();
    let mut seen = std::collections::HashSet::new();

    for cap in component_re.captures_iter(raw) {
        let node_id = cap
            .get(1)
            .or_else(|| cap.get(2))
            .map(|m| m.as_str().to_string());
        if let Some(node_id) = node_id {
            if seen.insert(node_id.clone()) {
                errors.push(ValidationError {
                    node_id,
                    message: extract_message_for_component(raw, &cap[0]),
                });
            }
        }
    }

    if errors.is_empty() {
        for line in raw.lines().filter(|l| l.contains("error")) {
            errors.push(ValidationError {
                node_id: String::new(),
                message: line.trim().to_string(),
            });
        }
    }

    errors
}

fn extract_message_for_component(raw: &str, needle: &str) -> String {
    raw.lines()
        .find(|line| line.contains(needle) || line.contains("error"))
        .unwrap_or(needle)
        .trim()
        .to_string()
}
