#!/usr/bin/env bash
#
# Verifies the WS4/H3 sandbox hardening against a live Docker daemon:
# that every language runtime still runs AND compiles under the exact
# HostConfig the execution-service applies (cap-drop ALL, no-new-privileges,
# read-only rootfs for the run step, writable /tmp tmpfs, network none,
# memory/pids/fsize/nofile limits).
#
# It talks straight to Docker with the same flags the service sets, so it
# needs only Docker + the codesphere-* runtime images — not the full stack.
#
# Usage:  bash scripts/verify-sandbox-hardening.sh
set -uo pipefail

RUN_FLAGS=(--rm --network none --memory 256m --memory-swap 256m --cpus 1
  --pids-limit 50 --cap-drop ALL --security-opt no-new-privileges
  --ulimit fsize=67108864 --ulimit nofile=256:256 --tmpfs /tmp:rw,nosuid,size=64m)
READONLY=(--read-only)   # run step: immutable rootfs
WRITABLE=()              # compile step: writable rootfs (toolchain scratch)

PASS=0; FAIL=0
ok()   { echo "  PASS: $1"; PASS=$((PASS+1)); }
bad()  { echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

if ! docker version >/dev/null 2>&1; then
  echo "Docker daemon not reachable. Start Docker and retry." >&2
  exit 1
fi

for img in python javascript cpp java go; do
  if ! docker image inspect "codesphere-${img}:latest" >/dev/null 2>&1; then
    echo "Missing image codesphere-${img}:latest — run scripts/build-runtime-images.sh first." >&2
    exit 1
  fi
done

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# run_case <label> <image> <readonly|writable> <workdir> <cmd...>
# writable == compile step: success is exit 0 (compilers print nothing on success).
# readonly == run step: success is exit 0 AND the program printed CODESPHERE_OK.
run_case() {
  local label="$1" image="$2" mode="$3" wd="$4"; shift 4
  local flags=("${RUN_FLAGS[@]}")
  [[ "$mode" == readonly ]] && flags+=("${READONLY[@]}")
  local out
  out="$(docker run "${flags[@]}" -v "$wd:/app" -w /app "codesphere-${image}:latest" "$@" 2>&1)"
  local rc=$?
  if [[ "$mode" == readonly ]]; then
    [[ $rc -eq 0 && "$out" == *"CODESPHERE_OK"* ]] && ok "$label" || bad "$label (rc=$rc) $out"
  else
    [[ $rc -eq 0 ]] && ok "$label" || bad "$label (rc=$rc) $out"
  fi
}

echo "== Interpreted (run step, read-only rootfs) =="
mkdir -p "$WORK/py";  echo 'print("CODESPHERE_OK")'            > "$WORK/py/solution.py"
run_case "python run" python readonly "$WORK/py" python solution.py
mkdir -p "$WORK/js";  echo 'console.log("CODESPHERE_OK")'      > "$WORK/js/solution.js"
run_case "node run"   javascript readonly "$WORK/js" node solution.js

echo "== Compiled (compile step writable, run step read-only) =="
mkdir -p "$WORK/c"
printf '#include <stdio.h>\nint main(){printf("CODESPHERE_OK\\n");return 0;}\n' > "$WORK/c/solution.c"
run_case "c compile"  cpp writable "$WORK/c" gcc -o solution solution.c
run_case "c run"      cpp readonly "$WORK/c" ./solution

mkdir -p "$WORK/cpp"
printf '#include <iostream>\nint main(){std::cout<<"CODESPHERE_OK"<<std::endl;return 0;}\n' > "$WORK/cpp/solution.cpp"
run_case "cpp compile" cpp writable "$WORK/cpp" g++ -o solution solution.cpp
run_case "cpp run"     cpp readonly "$WORK/cpp" ./solution

mkdir -p "$WORK/go"
printf 'package main\nimport "fmt"\nfunc main(){fmt.Println("CODESPHERE_OK")}\n' > "$WORK/go/solution.go"
# Go writes a build cache; if compile fails under these limits, give it HOME/GOCACHE in tmpfs
run_case "go compile"  go writable "$WORK/go" go build -o solution solution.go
run_case "go run"      go readonly "$WORK/go" ./solution

mkdir -p "$WORK/java"
printf 'public class Solution{public static void main(String[] a){System.out.println("CODESPHERE_OK");}}\n' > "$WORK/java/Solution.java"
run_case "java compile" java writable "$WORK/java" javac Solution.java
run_case "java run"     java readonly "$WORK/java" java Solution

echo
echo "Result: $PASS passed, $FAIL failed."
[[ $FAIL -eq 0 ]] || {
  echo "A compiler failing under --read-only usually means the toolchain writes"
  echo "outside /app and /tmp. Fix by adding a tmpfs/env (e.g. GOCACHE=/tmp/.gocache,"
  echo "HOME=/tmp) in buildHostConfig — do NOT disable read-only rootfs for the run step."
  exit 1
}
