#!/usr/bin/env bash
# Build the sandbox runtime images the execution-service launches per run.
# Image names must match languageConfig in
# backend/execution-service/src/utils/docker-executor.util.ts.
set -euo pipefail

cd "$(dirname "$0")/../backend/execution-service/docker/runtimes"

# typescript runs on the javascript image and c on the cpp image
# (see languageConfig), so only these five images are required.
LANGUAGES=(python javascript java cpp go)

for lang in "${LANGUAGES[@]}"; do
  echo "→ building codesphere-${lang}:latest"
  docker build -q -f "Dockerfile.${lang}" -t "codesphere-${lang}:latest" .
done

echo "✓ all runtime images built"
docker images | grep codesphere-
