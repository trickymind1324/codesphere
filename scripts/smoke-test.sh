#!/usr/bin/env bash
# CodeSphere API smoke test
#
# Verifies the core happy path: services up → register → login → list problems
# → submit code → execution returns a result.
#
# Prerequisites (run before this script):
#   1. docker-compose up -d                  # postgres + redis
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
require jq

step "1/6  Health checks"
for url in "$AUTH/health" "$PROBLEM/health" "$EXEC/health" "$ASSESS/health"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo 000)
  [[ "$code" == "200" ]] && ok "$url ($code)" || fail "$url returned $code (service down?)"
done

step "2/6  Register user $EMAIL"
register=$(curl -s -X POST "$AUTH/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"firstName\":\"Smoke\",\"lastName\":\"Test\"}")
echo "$register" | jq -e '.data.user.id // .user.id' >/dev/null \
  || fail "registration response missing user id: $register"
ok "registered"

step "3/6  Login"
login=$(curl -s -X POST "$AUTH/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$login" | jq -r '.data.accessToken // .accessToken // empty')
[[ -n "$TOKEN" ]] || fail "login response missing accessToken: $login"
ok "logged in, got JWT"

step "4/6  List problems"
problems=$(curl -s "$PROBLEM/problems?limit=5" -H "Authorization: Bearer $TOKEN")
count=$(echo "$problems" | jq '(.data.items // .items // .data // []) | length')
[[ "$count" -gt 0 ]] || fail "no problems returned: $problems"
PROBLEM_ID=$(echo "$problems" | jq -r '(.data.items // .items // .data)[0].id')
ok "got $count problems; using id=$PROBLEM_ID"

step "5/6  Execute trivial Python snippet"
exec_resp=$(curl -s -X POST "$EXEC/execute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"language":"python","code":"print(\"hello from smoke test\")","stdin":""}')
echo "$exec_resp" | jq -e '.data.stdout // .stdout' >/dev/null \
  || fail "execution did not return stdout: $exec_resp"
ok "execution succeeded"

step "6/6  List assessments (recruiter endpoint, expect 200 or 403)"
assess=$(curl -s -o /dev/null -w "%{http_code}" "$ASSESS/assessments" \
  -H "Authorization: Bearer $TOKEN")
[[ "$assess" == "200" || "$assess" == "403" ]] \
  && ok "assessment endpoint reachable ($assess)" \
  || fail "assessment endpoint returned $assess"

echo
color 32 "════════════════════════════════════════"
color 32 "  SMOKE TEST PASSED"
color 32 "════════════════════════════════════════"
