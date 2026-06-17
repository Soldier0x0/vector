use std::path::PathBuf;
use std::sync::Arc;

use crate::metrics::MetricsHub;

#[derive(Clone)]
pub struct AppState {
    pub config_path: PathBuf,
    pub ui_metadata_path: PathBuf,
    pub audit_path: PathBuf,
    pub templates_dir: PathBuf,
    pub vector_bin: String,
    pub vector_api_url: String,
    pub metrics_hub: Arc<MetricsHub>,
}

impl AppState {
    pub fn from_env() -> Self {
        let config_path = std::env::var("VECTOR_CONFIG_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("./config/pipeline.toml"));

        let ui_metadata_path = config_path.with_extension("ui.json");
        let audit_path = PathBuf::from(
            std::env::var("VECTOR_UI_AUDIT_PATH")
                .unwrap_or_else(|_| "./vector-ui-backend/audit/log.jsonl".to_string()),
        );
        let templates_dir = PathBuf::from(
            std::env::var("VECTOR_UI_TEMPLATES_DIR")
                .unwrap_or_else(|_| "./vector-ui-backend/templates".to_string()),
        );
        let vector_bin =
            std::env::var("VECTOR_BIN").unwrap_or_else(|_| "vector".to_string());
        let vector_api_url = std::env::var("VECTOR_API_URL")
            .unwrap_or_else(|_| "http://127.0.0.1:8686".to_string());

        Self {
            config_path,
            ui_metadata_path,
            audit_path,
            templates_dir,
            vector_bin,
            vector_api_url,
            metrics_hub: Arc::new(MetricsHub::new()),
        }
    }
}
