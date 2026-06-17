#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export PROTOC="${PROTOC:-$ROOT/.tools/bin/protoc}"
if [[ ! -x "$PROTOC" ]]; then
  echo "protoc not found; downloading to $ROOT/.tools ..."
  mkdir -p "$ROOT/.tools"
  curl -sSL -o /tmp/protoc.zip https://github.com/protocolbuffers/protobuf/releases/download/v29.3/protoc-29.3-linux-x86_64.zip
  unzip -qo /tmp/protoc.zip -d "$ROOT/.tools"
  export PROTOC="$ROOT/.tools/bin/protoc"
fi

CONFIG_PATH="${VECTOR_CONFIG_PATH:-./config/pipeline.toml}"
mkdir -p "$(dirname "$CONFIG_PATH")"

if [[ ! -s "$CONFIG_PATH" ]]; then
  cat > "$CONFIG_PATH" <<'EOF'
[api]
enabled = true
address = "127.0.0.1:8686"
EOF
fi

cleanup() {
  echo "Shutting down..."
  kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Building vector-ui-backend..."
cargo build -p vector-ui-backend --release

echo "Starting Vector (with --watch-config)..."
VECTOR_BIN="$ROOT/target/release/vector"
cargo build --release --bin vector
"$VECTOR_BIN" --config "$CONFIG_PATH" --watch-config &

echo "Starting backend..."
VECTOR_CONFIG_PATH="$CONFIG_PATH" \
VECTOR_BIN="$VECTOR_BIN" \
VECTOR_API_URL="${VECTOR_API_URL:-http://127.0.0.1:8686}" \
  "$ROOT/target/release/vector-ui-backend" &

echo "Starting frontend..."
npm --prefix vector-ui run dev &

wait
