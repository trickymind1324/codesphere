#!/usr/bin/env bash
# CodeSphere smoke test — runs against the full Docker Compose stack.
#
# Everything goes through the Kong edge at https://localhost (self-signed TLS
# in local setups, hence curl -k). Verifies the core happy path:
#   frontend loads → Keycloak OIDC discovery → login (seed recruiter) →
#   problems API → code execution → assessments API.
#
# Prerequisites:
#   docker compose -f docker-compose.prod.yml up -d   # stack running
#
# Usage:  bash scripts/smoke-test.sh [base-url]       # default https://localhost

set -euo pipefail

BASE="${1:-https://localhost}"
CURL="curl -sk"

USERNAME="${SMOKE_USER:-recruiter@codesphere.com}"
PASSWORD="${SMOKE_PASSWORD:-Recruiter123!}"

color() { printf "\033[1;%sm%s\033[0m\n" "$1" "$2"; }
ok()    { color 32 "✓ $1"; }
fail()  { color 31 "✗ $1"; exit 1; }

# 1. Frontend SPA
code=$($CURL -o /dev/null -w "%{http_code}" "$BASE/")
[ "$code" = "200" ] && ok "frontend serves ($code)" || fail "frontend returned $code"

# 2. Keycloak OIDC discovery
code=$($CURL -o /dev/null -w "%{http_code}" "$BASE/realms/codesphere/.well-known/openid-configuration")
[ "$code" = "200" ] && ok "keycloak OIDC discovery ($code)" || fail "keycloak discovery returned $code"

# 3. Login (first-party password grant, same as the SPA)
TOKEN=$($CURL -X POST "$BASE/realms/codesphere/protocol/openid-connect/token" \
  -d grant_type=password -d client_id=codesphere-frontend \
  -d username="$USERNAME" -d password="$PASSWORD" \
  | python3 -c "import json,sys; print(json.load(sys.stdin).get('access_token',''))")
[ -n "$TOKEN" ] && ok "login ($USERNAME)" || fail "login failed for $USERNAME"
AUTH=(-H "Authorization: Bearer $TOKEN")

# 4. Problems API
count=$($CURL "${AUTH[@]}" "$BASE/api/v1/problems?pageSize=1" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('total') or len(d.get('data',[])))")
[ "${count:-0}" -ge 1 ] && ok "problems API ($count problems)" || fail "problems API returned no problems"

# 5. Code execution (python hello through the sandbox)
out=$($CURL "${AUTH[@]}" -H "Content-Type: application/json" \
  -d '{"code":"print(\"smoke-ok\")","language":"python"}' \
  "$BASE/api/v1/execute/run" \
  | python3 -c "import json,sys; r=json.load(sys.stdin).get('result',{}); print((r.get('stdout') or '').strip(), r.get('status',''))")
case "$out" in
  *smoke-ok*) ok "code execution ($out)" ;;
  *) fail "code execution returned: $out" ;;
esac

# 6. Assessments API
code=$($CURL -o /dev/null -w "%{http_code}" "${AUTH[@]}" "$BASE/api/v1/assessments")
[ "$code" = "200" ] && ok "assessments API ($code)" || fail "assessments API returned $code"

color 32 "All smoke checks passed."
