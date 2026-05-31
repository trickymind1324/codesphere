#!/usr/bin/env bash
# CodeSphere API smoke test
#
# Verifies the core happy path: register → login → list problems → execute code
# → list assessments. Pass means all 4 services are reachable and behaving.
#
# Prerequisites (run before this script):
#   1. docker compose up -d                  # postgres + redis
#   2. Each backend service started:
#        backend/auth-service       (port 3001)
#        backend/problem-service    (port 8001)
#        backend/execution-service  (port 8002)
#        backend/assessment-service (port 8003)
#   3. Migrations + seeds applied (npm run migration:run; npm run seed)
#
# Usage:  bash scripts/smoke-test.sh

set -euo pipefail

AUTH=http://localhost:3001/api/v1
PROBLEM=http://localhost:8001/api/v1
EXEC=http://localhost:8002/api/v1
ASSESS=http://localhost:8003/api/v1

EMAIL="smoke+$(date +%s)@codesphere.test"
PASSWORD="SmokeTest!Pass123"

color() { printf "\033[1;%sm%s\033[0m\n" "$1" "$2"; }
ok()    { color 32 "✓ $1"; }
fail()  { color 31 "✗ $1"; exit 1; }
step()  { color 36 "→ $1"; }

require() {
  command -v "$1" >/dev/null 2>&1 || fail "missing dependency: $1"
}

require curl
require python3

# Use python3 instead of jq — some problem descriptions contain raw control
# chars that jq rejects but python's json module tolerates.
pyjq() { python3 -c "import json,sys; d=json.load(sys.stdin); $1"; }

step "1/5  Register candidate $EMAIL"
register=$(curl -s -X POST "$AUTH/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"Smoke Test\",\"role\":\"candidate\"}")
echo "$register" | pyjq "assert 'user' in d and 'id' in d['user'], d" \
  || fail "registration unexpected: $register"
ok "registered"

step "2/5  Login → get JWT"
login=$(curl -s -X POST "$AUTH/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$login" | pyjq "print(d.get('accessToken',''))")
[[ -n "$TOKEN" ]] || fail "login response missing accessToken: $login"
ok "got JWT (${#TOKEN} chars)"

step "3/5  List problems (expect ≥ 1)"
curl -s "$PROBLEM/problems?pageSize=3" -H "Authorization: Bearer $TOKEN" > /tmp/cs-smoke-probs.json
COUNT=$(pyjq "print(d.get('total', 0))" < /tmp/cs-smoke-probs.json)
[[ "$COUNT" -gt 0 ]] || fail "no problems returned (total=$COUNT). Did you run the seed?"
ok "$COUNT problems in catalog"

step "4/5  Execute Python snippet via /execute/run"
exec_resp=$(curl -s -X POST "$EXEC/execute/run" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language":"python","code":"print(\"smoke ok\")"}')
STDOUT=$(echo "$exec_resp" | pyjq "print(d.get('result',{}).get('stdout','').strip())")
[[ "$STDOUT" == "smoke ok" ]] || fail "execution stdout mismatch: $exec_resp"
ok "execution returned 'smoke ok'"

step "5/5  List assessments (expect 200)"
code=$(curl -s -o /tmp/cs-smoke-assess.json -w "%{http_code}" \
  "$ASSESS/assessments" -H "Authorization: Bearer $TOKEN")
[[ "$code" == "200" ]] || fail "assessment endpoint returned $code"
ok "assessment endpoint reachable"

rm -f /tmp/cs-smoke-probs.json /tmp/cs-smoke-assess.json

echo
color 32 "════════════════════════════════════════"
color 32 "  SMOKE TEST PASSED"
color 32 "════════════════════════════════════════"
