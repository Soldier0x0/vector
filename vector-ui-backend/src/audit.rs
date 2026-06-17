use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use crate::error::{ApiError, ApiResult};
use crate::models::AuditEntry;

pub fn read_audit(path: &Path, limit: usize, before: Option<&str>) -> ApiResult<Vec<AuditEntry>> {
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(path).map_err(|e| ApiError::Internal(e.to_string()))?;
    let mut entries: Vec<AuditEntry> = content
        .lines()
        .filter(|line| !line.trim().is_empty())
        .filter_map(|line| serde_json::from_str(line).ok())
        .collect();

    entries.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    if let Some(before_ts) = before {
        entries.retain(|entry| entry.timestamp < before_ts.to_string());
    }

    entries.truncate(limit);
    Ok(entries)
}

pub fn append_entry(
    path: &Path,
    nodes_added: &[String],
    nodes_removed: &[String],
    nodes_modified: &[String],
) -> ApiResult<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| ApiError::Internal(e.to_string()))?;
    }

    let entry = AuditEntry {
        timestamp: chrono::Utc::now().to_rfc3339(),
        nodes_added: nodes_added.to_vec(),
        nodes_removed: nodes_removed.to_vec(),
        nodes_modified: nodes_modified.to_vec(),
    };

    let line = serde_json::to_string(&entry).map_err(|e| ApiError::Internal(e.to_string()))?;
    use std::io::Write;
    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map_err(|e| ApiError::Internal(e.to_string()))?;
    writeln!(file, "{line}").map_err(|e| ApiError::Internal(e.to_string()))?;
    Ok(())
}

// silence unused import warning for BTreeMap if we extend diff summaries later
#[allow(dead_code)]
type _SummaryMap = BTreeMap<String, String>;
