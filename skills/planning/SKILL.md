---
name: planning
description: Use when you have a spec or requirements for a multi-step task, before touching code - produces one PLAN.md that is simultaneously a task plan, a dispatch table, and a contract inventory
---

# Planning

**Core principle:** one document, three readers. The same `PLAN.md` is read cover-to-cover by an implementer who needs exact steps, skimmed row-by-row by a dispatcher who needs to know what's claimable right now, and audited outcome-by-outcome by whoever has to answer "did we actually get everything we agreed to build." Write every id so all three readers land on the same row.

Write for an engineer with zero context for this codebase and questionable taste — skilled, but knowing nothing of the toolset or domain, and not trusted to invent good test design unsupervised. Everything that reader needs must be *in* the plan; "similar to the other one" and "use your judgment here" are failures, not brevity.

## Choosing Scope

Decide this before writing a single task. It determines whether you produce the full three-in-one apparatus below or skip it.

- **Solo** — the work is one coherent deliverable that fits in a single session, one worker, no fan-out. Write the task plan (below) to `docs/plans/YYYY-MM-DD-<feature>.md` and stop there: no Depth Tree, no dispatch table, no contract inventory. Execution runs the tasks in order against a single root `GATES.md`, authored per `ledger:verifying`. There is exactly one owner of everything, so there is nothing to reconcile.
- **Orchestrated** — the spec decomposes into several coherent deliverables that benefit from independent, fresh-context workers (parallel or simply isolated review boundaries). Write the full three-in-one `PLAN.md`: task plan, Depth Tree, dispatch table, and contract inventory, still saved to `docs/plans/YYYY-MM-DD-<feature>.md`. When `ledger:executing` begins dispatch, it copies this file into `.unlazy/<scope>/PLAN.md` — untracked, per `references/parallel.md` — and that copy, not the committed one, is where `State` transitions and lease claims actually happen. The committed file is the plan as agreed; the scoped file is the plan as it runs.

When in doubt, prefer solo. Standing up leaves, ownership leases, and a contract inventory for a task one session can finish cleanly is the planning equivalent of building `GATES.md` for a typo fix — process weight with nothing behind it to hide.

The rest of this skill assumes orchestrated scope. For solo scope, read only "Map the File Structure" through "No Placeholders," then skip to "Self-Review" and "Handoff."

## Map the File Structure

Before defining tasks, map which files will be created or modified and what each is responsible for. Decomposition decisions get locked in here, not while writing task steps.

- One clear responsibility per file. Files that change together live together; split by responsibility, not by technical layer.
- In an existing codebase, follow its established patterns — don't unilaterally restructure because you'd prefer smaller files. If a file you must touch has already grown unwieldy, a split can be one of the tasks.
- This map is what later becomes `Owns` in the dispatch table. Draw it precisely enough that two leaves never end up wanting the same file.

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate. Fold setup, configuration, scaffolding, and documentation into the task whose deliverable needs them. Split only where a reviewer could reject one task while approving its neighbor. Each task ends with an independently testable deliverable.

In orchestrated scope, a task and a leaf are the same unit — every task you write becomes exactly one row in the Depth Tree and exactly one row in the dispatch table, under the same id. Size tasks with that in mind: a task too small to dispatch on its own isn't a task, it's a step; a task that actually bundles two reviewable deliverables isn't one task, it's two leaves.

## Bite-Sized Steps

Each step inside a task is one action, 2–5 minutes:

- "Write the failing test" — step
- "Run it to confirm it fails" — step
- "Implement the minimal code to make it pass" — step
- "Run it to confirm it passes" — step
- "Commit" — step

## Task Structure

````markdown
### Task 1.1.1: Core rate limiter

**Files:**
- Create: `src/middleware/rate-limit.mjs`
- Test: `tests/middleware/rate-limit.test.mjs`

**Interfaces:**
- Consumes: nothing from an earlier task
- Produces: `rateLimit(opts: {limit: number, windowMs: number}) -> Middleware` —
  later tasks and the plan's own Contract import this exact name and shape.

- [ ] **Step 1: Write the failing test**

```javascript
test('rejects the 11th request in a 1s window with 429', async () => {
  const mw = rateLimit({ limit: 10, windowMs: 1000 })
  for (let i = 0; i < 10; i++) await mw(req, res, next)
  await mw(req, res, next)
  expect(res.statusCode).toBe(429)
})
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npm test -- rate-limit`
Expected: FAIL with "rateLimit is not defined"

- [ ] **Step 3: Write the minimal implementation**

```javascript
export function rateLimit ({ limit, windowMs }) {
  const hits = new Map()
  return async function rateLimitMiddleware (req, res, next) {
    const key = req.tenantId ?? 'default'
    const windowStart = Date.now() - windowMs
    const timestamps = (hits.get(key) ?? []).filter(t => t > windowStart)
    timestamps.push(Date.now())
    hits.set(key, timestamps)
    if (timestamps.length > limit) {
      res.statusCode = 429
      return res.end()
    }
    return next()
  }
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npm test -- rate-limit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/middleware/rate-limit.mjs tests/middleware/rate-limit.test.mjs
git commit -m "feat: add per-tenant rate limit middleware"
```
````

Task ids and file paths here are what the dispatch table's `Leaf`/`Owns` columns and the contract inventory's `Owner`/gate columns point back to — see "How The Three Views Connect" below for the same task carried all the way through. That id-sharing is why, in orchestrated scope, a task is numbered with its Depth Tree leaf id (`1.1.1`), not a flat sequence. In solo scope there is no tree to align with, so number tasks flatly instead — `Task 1`, `Task 2` — in the order they'll be executed.

A task's implementer sees only its own task block. `Files:` and `Interfaces:` exist because that implementer has no other way to learn which exact paths to touch or which exact signature a sibling task expects.

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:

- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without the actual test code)
- "Similar to Task N" (repeat the code — the engineer may read tasks out of order)
- Steps that describe what to do without showing how (code blocks are required for code steps)
- References to types, functions, or methods no task defines

This is the rule the rest of the plan exists to serve. A dispatch table with perfect `Owns` reconciliation and a contract inventory with every row `ACTIVE` are worthless if the task an implementer actually opens says "add appropriate error handling."

## Depth Tree Rules

Layer 1 is always the requested task as a whole. Split further only at a real domain boundary, component boundary, or verification boundary — never to hit a target leaf count. Each leaf must be one coherent deliverable; a leaf that exists only to make the tree deeper is filler, and filler leaves are the thing this rule exists to prevent.

Every branch (any node with children) gets an integration gate — authored from `templates/gates-node.md` per `ledger:verifying` — covering: re-verification of every named child, interface compatibility across children, end-to-end behavior across the branch, and regressions in affected siblings. A branch is never "done" because its children are; branch completion is its own gate.

If a `tree N` depth is requested explicitly, honor it only while every leaf at that depth stays a meaningful, independently reviewable deliverable. If going to the requested depth would force filler leaves, say so out loud and use the closest honest decomposition instead — depth is a structural tool for drawing real boundaries, not an arithmetic promise that effort was spent proportionally to leaf count.

## The Dispatch Table

One row per leaf in the tree, in the same document, using the same ids:

```markdown
| Leaf | Owns | Needs | Tier | Planned wave | State |
|---|---|---|---|---|---|
| 1.1.1 | `src/pricing/**` | - | mechanical | 1 | READY |
```

- **`Owns`** is the planning mirror of the leaf's own `OWNS:` header (see `references/parallel.md`) — the command-time authority that `gate-check.mjs --claim` actually reads when a leaf is claimed. Write the same paths here that the task's `Files:` block names. No tool compares the two: `--claim` reads only the leaf's own `OWNS:` header and never opens `PLAN.md`, so nothing at runtime checks that this column agrees with it. Reconciling them is a driver duty, not a tool guarantee — before a leaf goes `READY`, and again immediately before claiming it, normalize both sets by hand and confirm they are set-equal; on disagreement, stop, correct whichever one is wrong, and recheck, never assuming the plan is right because you wrote it first. What `--claim` does fail closed on is a different thing: a lease conflict between two concurrently claimed, overlapping paths (exit code 3). That protects against two leaves colliding on the same files; it does not protect against this column silently drifting from the ledger it's supposed to mirror.
- **State** is exactly one of `WAITING`, `READY`, `IN-FLIGHT`, `VERIFIED`, `ABANDONED` for a leaf, and exactly one of `OPEN`, `VERIFIED`, `ABANDONED` for a branch. At planning time every leaf starts `WAITING` unless its `Needs` is already empty, in which case it starts `READY`.
- **`Tier`** is `judgment` or `mechanical` — planner metadata about the leaf's own artifact, not a routing guarantee. Use `judgment` when the leaf's deliverable needs design, security, or compatibility reasoning, or non-mechanical verification; use `mechanical` only when the transformation pattern and its gates are already fixed. Map tier to a host model or reasoning control only where the host documents one; where it doesn't, tier stays a briefing and review requirement and you make no claim that a particular model was selected (`references/token-economy.md`). Driver and branch duties — dispatch, parent re-verification, branch integration, final audit — stay judgment work regardless of what tier every leaf under them carries; tier never weakens a leaf's own gates.
- **`Planned wave`** is the earliest intended launch group, a positive integer, with every dependency in an earlier wave than its dependents. It is a plan, not a barrier — rolling dispatch may start a later wave early once that row's `Needs` verify, without waiting on unrelated work.
- Two leaves planned for the same wave must never own overlapping paths. If work genuinely can't be split cleanly, that's a sign the split is wrong: make the shared piece an earlier dependency both leaves `Needs`, or carve it into its own integration leaf. `references/parallel.md` documents exactly which glob pairs the checker treats as disjoint versus conflicting — when in doubt it will refuse the ambiguous case, so plan simpler, more obviously disjoint ownership rather than relying on a clever glob.

## The Contract Inventory

Every independently omittable required outcome, and every constraint that changes acceptance, gets its own row with a stable id, an owner, and something that observes it — a specific gate, or a named manual review when no command can decide it:

```markdown
| ID | Required outcome or constraint | Owner | Observing gate or manual review | Disposition | Revision |
|---|---|---|---|---|---|
| C1 | <concise paraphrase> | <leaf/node> | <qualified gate id or reviewer> | ACTIVE | 1 |
```

- `Owner` is a leaf or branch id from the same tree — the same id that appears in the dispatch table. A contract row with no owner, or an owner that isn't in the dispatch table, is a plan bug.
- `Observing gate or manual review` is a qualified gate id (`gates/leaf-1.1.1.md:G1`) or a named person/role for a manual review — never blank, never "will verify later."
- `Disposition` is `ACTIVE` only while it has both a current owner and a current observer. `ABANDONED`, `DEFERRED`, and `OWNER_DECISION` are honest non-completion states, not failures to hide. Only explicit user authority may mark a row `REMOVED_BY_USER`.
- When the user changes scope mid-plan, increment `Revision` and reconcile every row the change touches — including its owner and observer — before any further dispatch. A stale contract row is how a quietly dropped requirement survives to the final report.

Do not author the gates themselves here — that craft belongs to `ledger:verifying` (`templates/gates-leaf.md`, `templates/gates-node.md`). This section decides *which* outcomes need an observer and *who* owns making sure one exists; `ledger:verifying` decides how to write a `CHECK:`/`EXPECT:` pair that can actually fail.

## How The Three Views Connect

The task plan, the dispatch table, and the contract inventory are not three sections a reader assembles by hand — they're three views of the same leaf, joined by its id. Continuing the rate-limiter task from "Task Structure" above, in one `PLAN.md`:

```markdown
# Plan: Per-tenant rate limiting

Spec: docs/specs/2026-09-06-rate-limiting-design.md
Scope: ratelimit
Depth: tree 2
Mode: orchestrated

## Contract

- Interfaces: `rateLimit(opts: {limit: number, windowMs: number}) -> Middleware`
- Ownership: 1.1.1 owns `src/middleware/rate-limit.mjs`, `tests/middleware/rate-limit.test.mjs`
- Dependencies: 1.1.2 needs 1.1.1 VERIFIED
- Host launch mode: Claude background Agents
- Wave policy: ready-1 launches 1.1.1 alone; ready-2 launches 1.1.2 once 1.1.1 is VERIFIED
- Toolchain: Node 20, `npm test`, repository root as working directory
- Conventions: middleware is a factory, never a singleton
- Manual review: override-header privilege check, owner @security-owner

## Tree

- 1 rate limiting ............ GATES.md
  - 1.1 ingest path .......... gates/node-1.1.md
    - 1.1.1 core limiter ..... gates/leaf-1.1.1.md
    - 1.1.2 admin override ... gates/leaf-1.1.2.md

## Leaf dispatch table

| Leaf | Owns | Needs | Tier | Planned wave | State |
|---|---|---|---|---|---|
| 1.1.1 | `src/middleware/rate-limit.mjs`, `tests/middleware/rate-limit.test.mjs` | - | mechanical | 1 | READY |
| 1.1.2 | `src/routes/admin-override.mjs`, `tests/routes/admin-override.test.mjs` | 1.1.1 | judgment | 2 | WAITING |

## Current contract inventory

| ID | Required outcome or constraint | Owner | Observing gate or manual review | Disposition | Revision |
|---|---|---|---|---|---|
| C1 | Requests past the per-tenant limit are rejected with 429 | 1.1.1 | gates/leaf-1.1.1.md:G1 | ACTIVE | 1 |
| C2 | Override header bypasses the limit only for the override role | 1.1.2 | gates/leaf-1.1.2.md:G1 | ACTIVE | 1 |
| C3 | Override header reviewed for privilege escalation before release | 1.1.2 | manual review, @security-owner | ACTIVE | 1 |
```

Follow the paths and ids across the document: `1.1.1`'s `Owns` cell names the exact same two paths as Task 1.1.1's `Files:` block above — that equality is something the driver maintains by hand, not something any tool checks; `gate-check.mjs --claim` reads only `gates/leaf-1.1.1.md`'s own `OWNS:` header when it claims that leaf, and never opens this file. `1.1.1` is `Owner` on contract row `C1`, and `C1`'s observing gate, `gates/leaf-1.1.1.md:G1`, points at that same leaf's own ledger — `gates/leaf-1.1.1.md`, not the root `GATES.md` — once `ledger:verifying` authors it. `1.1.2`'s `Needs` cell names `1.1.1`, matching the Contract's `Dependencies:` line and the wave policy that puts it a wave later. Nothing in this document repeats free-floating prose about "the override feature" — every mention of it is one of these three tied-together rows.

## Self-Review

Run this yourself after writing the complete plan — it is a checklist, not a subagent dispatch:

1. **Spec coverage.** Walk the spec section by section. For every requirement, point to the task (and, in orchestrated scope, the contract row) that covers it. List any gap.
2. **Placeholder scan.** Reread every task against "No Placeholders" above. Fix violations inline.
3. **Type consistency.** Do the signatures, method names, and property names used in later tasks match what earlier tasks defined? A function `clearLayers()` in Task 1.1.1 and `clearFullLayers()` in Task 1.2.1 is a plan bug.
4. **Orchestrated scope only — reconciliation.** Does every dispatch-table `Owns` cell match its task's `Files:` block, set for set? Does every contract row have a live owner and observer that both actually exist in the tree? Is any wave assignment putting a dependent before its dependency?

Fix what you find and move on — don't re-review from scratch. If a spec requirement has no task, add the task (and, if orchestrated, its leaf and contract row) before calling the plan done.

[`plan-document-reviewer-prompt.md`](./plan-document-reviewer-prompt.md) in this skill's directory has a dispatchable subagent prompt for an independent second pass over the same four checks, for use when a plan is consequential enough to warrant one; it is optional, not a replacement for the self-review above.

## Default Paths

- Plans: `docs/plans/YYYY-MM-DD-<feature>.md`
- Specs (from `ledger:brainstorming`, read but not written here): `docs/specs/YYYY-MM-DD-<topic>-design.md`

User-stated preferences for either location override these defaults.

## Handoff

Before implementation starts, gates get authored: one `GATES.md` for solo scope, or one `gates/leaf-*.md` per leaf and `gates/node-*.md` per branch for orchestrated scope — copied from `templates/gates-leaf.md` / `templates/gates-node.md` per `ledger:verifying`, before that unit's first step runs, never after. This skill decided *who* owns each outcome and *what* observes it; `ledger:verifying` decides how to write a `CHECK:`/`EXPECT:` pair that can actually fail.

Once gates exist, hand the plan to `ledger:executing`. In solo scope it runs the plan's tasks in order, in-session, against that one root `GATES.md` — its "Solo Scope" section. In orchestrated scope it reads the dispatch table to decide what's claimable, drives waves of leaves through their gates, and runs branch integration as children verify.

## Full Reference

- [`templates/PLAN.md`](../../templates/PLAN.md) — the complete orchestrated plan template: header, Contract, state vocabulary, Tree, dispatch table, and status-log conventions in full, with every field this skill only summarizes.
- [`templates/gates-leaf.md`](../../templates/gates-leaf.md), [`templates/gates-node.md`](../../templates/gates-node.md) — gate ledger templates; how to fill them in is `ledger:verifying`'s job, not this skill's.
- [`references/parallel.md`](../../references/parallel.md) — full `OWNS:`/lease semantics, the `.unlazy/<scope>/` layout, and the glob-overlap rules behind "two leaves must never own the same path."
- [`references/token-economy.md`](../../references/token-economy.md) — where `Tier` comes from and its explicit caveat that it is planner metadata, not a routing guarantee.
