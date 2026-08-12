#!/usr/bin/env bash
# Generate a self-signed TLS cert for LOCAL/dev use, so Kong serves a real
# (if untrusted) cert on :443 instead of its throwaway default. Never commit
# the output — infrastructure/kong/certs/*.pem is gitignored.
#
# Production: replace these with real certs (Let's Encrypt / your CA) at the
# same paths, or point KONG_SSL_CERT[_KEY] elsewhere.
set -euo pipefail
CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/infrastructure/kong/certs"
mkdir -p "$CERT_DIR"

if [[ -f "$CERT_DIR/privkey.pem" && "${FORCE:-}" != "1" ]]; then
  echo "Certs already exist in $CERT_DIR (set FORCE=1 to regenerate)."
  exit 0
fi

openssl req -x509 -newkey rsa:2048 -nodes -days 825 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 "$CERT_DIR/privkey.pem"
echo "Wrote self-signed cert to $CERT_DIR (fullchain.pem, privkey.pem)."
echo "Browsers will warn on the self-signed cert — expected for local dev."
