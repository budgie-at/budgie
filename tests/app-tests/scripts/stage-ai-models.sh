#!/usr/bin/env bash
# Clones the on-device AI models into a simulator app container so an AI capture run never waits on the ~2.5 GB Hugging Face download the app would otherwise start itself.
set -euo pipefail

SIMULATOR_UDID="${1:?usage: stage-ai-models.sh <simulator-udid> <app-id> [models-dir]}"
APP_ID="${2:?usage: stage-ai-models.sh <simulator-udid> <app-id> [models-dir]}"
MODELS_DIR="${3:-$HOME/budgie-ai-models}"

CHAT_MODEL=Qwen3-1.7B-Q4_K_M.gguf
EMBEDDING_MODEL=nomic-embed-text-v2-moe.Q8_0.gguf
WHISPER_MODEL=ggml-large-v3-turbo-q8_0.bin

for model in "$CHAT_MODEL" "$EMBEDDING_MODEL" "$WHISPER_MODEL"; do
    if [ ! -f "$MODELS_DIR/$model" ]; then
        echo "stage-ai-models: missing $MODELS_DIR/$model" >&2

        exit 1
    fi
done

DOCUMENTS_DIR="$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_ID" data)/Documents"

mkdir -p "$DOCUMENTS_DIR/ai-models"
cp -c "$MODELS_DIR/$CHAT_MODEL" "$DOCUMENTS_DIR/$CHAT_MODEL"
cp -c "$MODELS_DIR/$EMBEDDING_MODEL" "$DOCUMENTS_DIR/$EMBEDDING_MODEL"
cp -c "$MODELS_DIR/$WHISPER_MODEL" "$DOCUMENTS_DIR/ai-models/$WHISPER_MODEL"

echo "stage-ai-models: staged into $DOCUMENTS_DIR"
