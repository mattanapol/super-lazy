#!/usr/bin/env node
// Runs the vendored tests/self-check.mjs and passes only when its failures
// are exactly the three that assert unlazy's own repo layout — a root
// SKILL.md and references/orchestration.md — which ledger restructures into
// per-skill files by design. See docs/specs/2026-09-06-ledger-design.md.
//
// Any other failure fails this gate. So does one of the three passing:
// that means upstream changed the assertion and this exclusion needs review.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const KNOWN_LAYOUT_MISMATCHES = [
  'every local resource the skill names exists',
  'leaf release precedes dependent promotion everywhere',
  'request reconciliation keeps the focused solo cheap path'
]

const run = spawnSync(process.execPath, [join(ROOT, 'tests', 'self-check.mjs')], {
  cwd: ROOT,
  encoding: 'utf8'
})

if (run.error) {
  console.error(`ERROR could not run self-check.mjs: ${run.error.message}`)
  process.exit(1)
}

const output = `${run.stdout ?? ''}${run.stderr ?? ''}`

// Distinguish "the child never ran" from "a known mismatch started passing".
// Both leave `failed` empty, but they need opposite diagnoses: a crash points
// at self-check.mjs, a genuine pass points at this exclusion list.
const recognized = [...output.matchAll(/^(?:ok|FAIL)\s+\S/gm)]
if (recognized.length === 0) {
  console.error('ERROR self-check.mjs produced no recognizable check output — it likely failed to run')
  console.error(`  exit status: ${run.status}`)
  const tail = output.trim().split('\n').slice(-5).join('\n')
  if (tail) console.error(`  last output:\n${tail}`)
  process.exit(1)
}

const failed = [...output.matchAll(/^FAIL (.+)$/gm)].map(m => m[1].trim())

const unexpected = failed.filter(f => !KNOWN_LAYOUT_MISMATCHES.includes(f))
const nowPassing = KNOWN_LAYOUT_MISMATCHES.filter(k => !failed.includes(k))

for (const f of unexpected) console.error(`ERROR unexpected self-check failure: ${f}`)
for (const k of nowPassing) {
  console.error(`ERROR known layout mismatch now passes, revisit the exclusion: ${k}`)
}

if (unexpected.length > 0 || nowPassing.length > 0) {
  console.error(`${unexpected.length + nowPassing.length} problem(s) found`)
  process.exit(1)
}

console.log(
  `vendor self-check passed (${KNOWN_LAYOUT_MISMATCHES.length} known layout mismatches excluded)`
)
