#!/usr/bin/env bash
set -e

# Change to project root
cd "$(dirname "$0")/.."

# Build with optional API URL override
API_URL="${1:-}"
if [ -n "$API_URL" ]; then
    docker compose build --build-arg API_URL="$API_URL"
else
    docker compose build
fi
