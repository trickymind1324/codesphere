#!/usr/bin/env bash
# Validate the Kong declarative config with a throwaway Kong container.
# No running stack required.
set -euo pipefail
CONFIG="$(cd "$(dirname "$0")/.." && pwd)/infrastructure/kong/kong.yml"
echo "Validating $CONFIG"
docker run --rm -e KONG_DATABASE=off \
  -v "$CONFIG:/kong/kong.yml:ro" \
  kong:3.9 kong config parse /kong/kong.yml
echo "kong.yml is valid."
