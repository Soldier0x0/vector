use std::fs;
use std::path::Path;

use uuid::Uuid;

use crate::config::AppState;
use crate::error::{ApiError, ApiResult};
use crate::models::{ApplyTemplateRequest, PipelineGraph, PipelineNode, Position, Template};
use crate::pipeline::save_pipeline;

pub fn list_templates(dir: &Path) -> ApiResult<Vec<Template>> {
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut templates = Vec::new();
    for entry in fs::read_dir(dir).map_err(|e| ApiError::Internal(e.to_string()))? {
        let entry = entry.map_err(|e| ApiError::Internal(e.to_string()))?;
        let path = entry.path();
        let ext = path.extension().and_then(|s| s.to_str());
        if !matches!(ext, Some("toml") | Some("vrl")) {
            continue;
        }
        if let Ok(template) = read_template_file(&path) {
            templates.push(template);
        }
    }
    templates.sort_by(|a, b| a.title.cmp(&b.title));
    Ok(templates)
}

pub fn apply_template(
    state: &AppState,
    template_id: &str,
    request: ApplyTemplateRequest,
) -> ApiResult<PipelineGraph> {
    let template = list_templates(&state.templates_dir)?
        .into_iter()
        .find(|t| t.id == template_id)
        .ok_or_else(|| ApiError::NotFound(format!("template `{template_id}` not found")))?;

    let mut graph = request.target_pipeline;
    let node_id = format!(
        "{}_{}",
        sanitize_id(&template.id),
        &Uuid::new_v4().to_string()[..8]
    );
    let y = 120.0 + graph.nodes.len() as f64 * 90.0;

    let transform = PipelineNode {
        id: node_id.clone(),
        kind: "transform".to_string(),
        component_type: "remap".to_string(),
        label: template.title.clone(),
        config: serde_json::json!({
            "type": "remap",
            "source": template.vrl_source,
        }),
        position: Position { x: 340.0, y },
        transform_type: Some("remap".to_string()),
    };

    graph.nodes.push(transform);

    let saved = save_pipeline(state, &graph).map_err(|err| match err {
        crate::pipeline::SaveError::Validation(result) => {
            ApiError::Validation(serde_json::to_string(&result).unwrap_or_default())
        }
        crate::pipeline::SaveError::Internal(msg) => ApiError::Internal(msg),
    })?;
    Ok(saved)
}

fn read_template_file(path: &Path) -> ApiResult<Template> {
    let content = fs::read_to_string(path).map_err(|e| ApiError::Internal(e.to_string()))?;
    if path.extension().and_then(|s| s.to_str()) == Some("vrl") {
        let id = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("template")
            .to_string();
        return Ok(Template {
            id: id.clone(),
            title: id.replace('-', " "),
            description: String::new(),
            tags: Vec::new(),
            vrl_source: content,
        });
    }

    let table: toml::Table = toml::from_str(&content).map_err(|e| ApiError::Internal(e.to_string()))?;
    Ok(Template {
        id: table
            .get("id")
            .and_then(|v| v.as_str())
            .map(str::to_string)
            .unwrap_or_else(|| {
                path.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("template")
                    .to_string()
            }),
        title: table
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or("Untitled")
            .to_string(),
        description: table
            .get("description")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        tags: table
            .get("tags")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(str::to_string))
                    .collect()
            })
            .unwrap_or_default(),
        vrl_source: table
            .get("vrl_source")
            .and_then(|v| v.as_str())
            .map(str::to_string)
            .unwrap_or_default(),
    })
}

fn sanitize_id(id: &str) -> String {
    id.chars()
        .map(|c| if c.is_alphanumeric() || c == '_' { c } else { '_' })
        .collect()
}
