#!/usr/bin/env bash
# Vendor unlazy's enforcement tooling byte-identical from a pinned commit.
#
#   tools/sync-unlazy.sh            verify vendored files against VENDOR.lock
#   tools/sync-unlazy.sh --update   re-download at UNLAZY_PIN, rewrite lockfile
#
# Never hand-edit a vendored file: the lockfile check will reject it, and the
# next update would silently discard the edit.
set -euo pipefail

UNLAZY_PIN="${UNLAZY_PIN:-16671491f6679ad9378f52604d3bc2415b4120c7}"
BASE="https://raw.githubusercontent.com/Leonxlnx/unlazy/${UNLAZY_PIN}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOCK="${ROOT}/VENDOR.lock"

# upstream path -> local path
MAP=(
  "scripts/gate-check.mjs:scripts/gate-check.mjs"
  "scripts/gate-lint.mjs:scripts/gate-lint.mjs"
  "scripts/dispatch-check.mjs:scripts/dispatch-check.mjs"
  "scripts/stop-hook.mjs:scripts/stop-hook.mjs"
  "scripts/install-hooks.mjs:scripts/install-hooks.mjs"
  "scripts/lib/check-supervisor.mjs:scripts/lib/check-supervisor.mjs"
  "scripts/lib/dispatch.mjs:scripts/lib/dispatch.mjs"
  "scripts/lib/gates.mjs:scripts/lib/gates.mjs"
  "scripts/lib/process-tree.mjs:scripts/lib/process-tree.mjs"
  "scripts/lib/regex-worker.mjs:scripts/lib/regex-worker.mjs"
  "tests/run-tests.mjs:tests/vendor/run-tests.mjs"
  "tests/dispatch-tests.mjs:tests/vendor/dispatch-tests.mjs"
  "tests/hardening-tests.mjs:tests/vendor/hardening-tests.mjs"
  "tests/stress-tests.mjs:tests/vendor/stress-tests.mjs"
  "tests/lint-tests.mjs:tests/vendor/lint-tests.mjs"
  "tests/contract-tests.mjs:tests/vendor/contract-tests.mjs"
  "tests/self-check.mjs:tests/vendor/self-check.mjs"
  "templates/PLAN.md:templates/PLAN.md"
  "templates/gates-leaf.md:templates/gates-leaf.md"
  "templates/gates-node.md:templates/gates-node.md"
  "references/gates.md:references/gates.md"
  "references/dispatch.md:references/dispatch.md"
  "references/parallel.md:references/parallel.md"
  "references/token-economy.md:references/token-economy.md"
  "SECURITY.md:references/SECURITY.md"
)

sha_of() { shasum -a 256 "$1" | awk '{print $1}'; }

if [ "${1:-}" = "--update" ]; then
  : > "${LOCK}.tmp"
  for entry in "${MAP[@]}"; do
    remote="${entry%%:*}"
    local_path="${entry#*:}"
    mkdir -p "${ROOT}/$(dirname "$local_path")"
    curl -sfL "${BASE}/${remote}" -o "${ROOT}/${local_path}"
    echo "$(sha_of "${ROOT}/${local_path}")  ${local_path}" >> "${LOCK}.tmp"
    echo "fetched ${local_path}"
  done
  { echo "# unlazy vendored at ${UNLAZY_PIN}"; sort -k2 "${LOCK}.tmp"; } > "$LOCK"
  rm -f "${LOCK}.tmp"
  echo "vendor update complete"
  exit 0
fi

failures=0
while read -r expected path; do
  case "$expected" in \#*) continue ;; esac
  [ -z "$expected" ] && continue
  if [ ! -f "${ROOT}/${path}" ]; then
    echo "MISSING ${path}" >&2
    failures=$((failures + 1))
  elif [ "$(sha_of "${ROOT}/${path}")" != "$expected" ]; then
    echo "MODIFIED ${path}" >&2
    failures=$((failures + 1))
  fi
done < "$LOCK"

if [ "$failures" -ne 0 ]; then
  echo "${failures} vendored file(s) missing or modified" >&2
  exit 1
fi
echo "vendor verification passed"
