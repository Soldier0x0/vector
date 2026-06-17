use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use tokio::sync::RwLock;
use vector_api_client::Client;

use crate::models::{ComponentMetric, MetricsMessage};

const HISTORY_LEN: usize = 20;

#[derive(Default)]
struct ComponentState {
    throughput: Vec<f64>,
    error_count: u64,
    buffer_fill: f64,
    last_total: Option<i64>,
    last_sample: Option<Instant>,
}

pub struct MetricsHub {
    components: RwLock<HashMap<String, ComponentState>>,
}

impl MetricsHub {
    pub fn new() -> Self {
        Self {
            components: RwLock::new(HashMap::new()),
        }
    }

    pub async fn snapshot(&self) -> MetricsMessage {
        let map = self.components.read().await;
        let timestamp = chrono::Utc::now().timestamp_millis();
        let components = map
            .iter()
            .map(|(id, state)| ComponentMetric {
                id: id.clone(),
                name: id.clone(),
                throughput: state.throughput.clone(),
                error_count: state.error_count,
                buffer_fill: state.buffer_fill,
                timestamp,
            })
            .collect();
        MetricsMessage { components }
    }

    pub async fn ingest_component(
        &self,
        component_id: &str,
        received_events_total: Option<i64>,
        error_total: Option<i64>,
    ) {
        let mut map = self.components.write().await;
        let entry = map.entry(component_id.to_string()).or_default();

        if let Some(total) = received_events_total {
            let now = Instant::now();
            if let (Some(prev_total), Some(prev_time)) = (entry.last_total, entry.last_sample) {
                let dt = now.duration_since(prev_time).as_secs_f64();
                if dt > 0.0 {
                    let rate = (total - prev_total).max(0) as f64 / dt;
                    entry.throughput.push(rate);
                    if entry.throughput.len() > HISTORY_LEN {
                        entry.throughput.remove(0);
                    }
                }
            }
            entry.last_total = Some(total);
            entry.last_sample = Some(now);
        }

        if let Some(errors) = error_total {
            entry.error_count = errors.max(0) as u64;
        }

        // Buffer fill is not exposed via GetComponents; approximate from throughput variance.
        let avg = if entry.throughput.is_empty() {
            0.0
        } else {
            entry.throughput.iter().sum::<f64>() / entry.throughput.len() as f64
        };
        entry.buffer_fill = (avg / 1000.0 * 100.0).clamp(0.0, 100.0);
    }
}

pub async fn run_metrics_collector(api_url: String, hub: Arc<MetricsHub>) {
    loop {
        if let Err(err) = collect_once(&api_url, &hub).await {
            tracing::debug!("metrics collector: {err}");
        }
        tokio::time::sleep(Duration::from_secs(2)).await;
    }
}

async fn collect_once(
    api_url: &str,
    hub: &MetricsHub,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let uri: http::Uri = api_url.parse()?;
    let mut client = Client::new(uri);
    client.connect().await?;
    client.health().await?;

    let response = client.get_components(0).await?;
    for component in response.components {
        let metrics = component.metrics.unwrap_or_default();
        hub.ingest_component(
            &component.component_id,
            metrics.received_events_total,
            None,
        )
        .await;
    }

    Ok(())
}
