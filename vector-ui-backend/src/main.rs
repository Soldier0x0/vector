mod audit;
mod config;
mod config_convert;
mod error;
mod metrics;
mod models;
mod pipeline;
mod templates;
mod vrl_test;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::{
    extract::{Path, Query, State, WebSocketUpgrade},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use tower_http::cors::{Any, CorsLayer};

use crate::config::AppState;
use crate::error::{ApiError, ApiResult};
use crate::models::{
    ApplyTemplateRequest, MetricsMessage, PipelineGraph, ValidationResult, VrlTestRequest,
    VrlTestResponse,
};
use crate::metrics::run_metrics_collector;

#[derive(Debug, Deserialize)]
struct AuditQuery {
    limit: Option<usize>,
    before: Option<String>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "vector_ui_backend=info,tower_http=info".into()),
        )
        .init();

    let state = AppState::from_env();
    let metrics_hub = Arc::clone(&state.metrics_hub);

    tokio::spawn(run_metrics_collector(
        state.vector_api_url.clone(),
        metrics_hub,
    ));

    let app = Router::new()
        .route("/api/health", get(health))
        .route("/api/pipeline", get(get_pipeline).post(post_pipeline))
        .route("/api/pipeline/validate", post(validate_pipeline))
        .route("/api/vrl/test", post(vrl_test))
        .route("/api/templates", get(list_templates))
        .route("/api/templates/:id/apply", post(apply_template))
        .route("/api/audit", get(get_audit))
        .route("/ws/metrics", get(metrics_ws))
        .with_state(state)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    let addr = SocketAddr::from(([0, 0, 0, 0], 4000));
    tracing::info!("vector-ui-backend listening on {addr}");
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok" }))
}

async fn get_pipeline(State(state): State<AppState>) -> ApiResult<Json<PipelineGraph>> {
    Ok(Json(pipeline::read_pipeline(&state)?))
}

async fn post_pipeline(
    State(state): State<AppState>,
    Json(graph): Json<PipelineGraph>,
) -> impl IntoResponse {
    match pipeline::save_pipeline(&state, &graph) {
        Ok(saved) => Json(saved).into_response(),
        Err(pipeline::SaveError::Validation(result)) => {
            (StatusCode::UNPROCESSABLE_ENTITY, Json(result)).into_response()
        }
        Err(pipeline::SaveError::Internal(msg)) => ApiError::Internal(msg).into_response(),
    }
}

async fn validate_pipeline(
    State(state): State<AppState>,
    Json(graph): Json<PipelineGraph>,
) -> ApiResult<Json<ValidationResult>> {
    Ok(Json(pipeline::validate_pipeline(&state, &graph)?))
}

async fn vrl_test(Json(body): Json<VrlTestRequest>) -> ApiResult<Json<VrlTestResponse>> {
    Ok(Json(vrl_test::test_vrl(body)?))
}

async fn list_templates(State(state): State<AppState>) -> ApiResult<Json<Vec<crate::models::Template>>> {
    Ok(Json(templates::list_templates(&state.templates_dir)?))
}

async fn apply_template(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<ApplyTemplateRequest>,
) -> ApiResult<Json<PipelineGraph>> {
    Ok(Json(templates::apply_template(&state, &id, body)?))
}

async fn get_audit(
    State(state): State<AppState>,
    Query(query): Query<AuditQuery>,
) -> ApiResult<Json<Vec<crate::models::AuditEntry>>> {
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    Ok(Json(audit::read_audit(
        &state.audit_path,
        limit,
        query.before.as_deref(),
    )?))
}

async fn metrics_ws(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_metrics_socket(socket, state))
}

async fn handle_metrics_socket(mut socket: axum::extract::ws::WebSocket, state: AppState) {
    let mut interval = tokio::time::interval(std::time::Duration::from_secs(2));
    loop {
        interval.tick().await;
        let snapshot: MetricsMessage = state.metrics_hub.snapshot().await;
        let payload = match serde_json::to_string(&snapshot) {
            Ok(json) => json,
            Err(_) => continue,
        };
        if socket
            .send(axum::extract::ws::Message::Text(payload))
            .await
            .is_err()
        {
            break;
        }
    }
}

// Keep module exports available to integration tests
pub use pipeline::SaveError;
