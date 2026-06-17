# Vector Pipeline UI — Backend

Axum API server for the Vector pipeline management UI.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/pipeline` | Load config as graph JSON |
| POST | `/api/pipeline` | Validate & save graph to TOML |
| POST | `/api/pipeline/validate` | Validate without saving |
| POST | `/api/vrl/test` | Run VRL against a test event |
| GET | `/api/templates` | List templates from disk |
| POST | `/api/templates/:id/apply` | Apply template and persist |
| GET | `/api/audit` | Audit log (`?limit=50&before=timestamp`) |
| WS | `/ws/metrics` | Component metrics stream |

## Environment

| Variable | Default |
|----------|---------|
| `VECTOR_CONFIG_PATH` | `./config/pipeline.toml` |
| `VECTOR_BIN` | `vector` |
| `VECTOR_API_URL` | `http://127.0.0.1:8686` |
| `VECTOR_UI_AUDIT_PATH` | `./vector-ui-backend/audit/log.jsonl` |
| `VECTOR_UI_TEMPLATES_DIR` | `./vector-ui-backend/templates` |

UI node positions are stored in a sidecar file next to the config (e.g. `config/pipeline.ui.json`).

## Build

Requires `protoc` (used by `vector-api-client`). `scripts/dev.sh` downloads it automatically if missing.

```bash
export PROTOC=/path/to/protoc
cargo build -p vector-ui-backend
```
