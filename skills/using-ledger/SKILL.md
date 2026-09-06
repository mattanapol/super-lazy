---
name: using-ledger
description: Use when starting any conversation - establishes how to find and use skills, and how much completion machinery a task warrants, before any response including clarifying questions
---

# Using Ledger

<SUBAGENT-STOP>
Dispatched as a subagent to execute one specific task? Ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If there is even a 1% chance a skill applies, invoke it — before any response, clarifying question, or file exploration. Not negotiable; do not rationalize out of it.
</EXTREMELY-IMPORTANT>

## The Rule

Announce "Using [skill] to [purpose]," then follow it exactly. If it has a checklist, create a todo per item. Wrong choice? Change skills — but choose one first.

## Skill Priority

When more than one skill could apply, process skills go first — they set the approach; implementation skills carry it out.

- "Let's build X" → `ledger:brainstorming` first.
- "Fix this bug" → `ledger:systematic-debugging` first.

## The Workflow

`ledger:brainstorming` → `ledger:planning` → `ledger:executing` → `ledger:verifying` → `ledger:finishing-a-development-branch`.

That's the spine. Each stage pulls in the narrower skill it needs — tests, worktrees, review — on its own; this router doesn't enumerate them.

## Red Flags

These thoughts mean stop — you're rationalizing:

| Thought | Reality |
|---|---|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |

## Choosing The Mode

`ledger:planning` recognizes two scopes, not three:

- **Solo** — one `GATES.md`, for a focused task that fits one working session.
- **Orchestrated** — a scoped pipeline under `.unlazy/<scope>/`, for a build or deep review that needs fresh contexts per deliverable.

**Parallel** is not a third scope — it's how `ledger:executing` runs an orchestrated pipeline: sealed waves launched together, one wave per set of leaves whose `OWNS:` paths are disjoint. Leaves that aren't independent just run one to a wave; same driver loop either way.

## Proportion

Skip the gate, the plan, and the pipeline for a trivial edit or a factual reply — glance at the result and answer. Both halves of this plugin pull toward process; this is the bound. Ceremony scales with the cost of being quietly wrong, not with how much machinery is available: a typo fix earns no `PLAN.md`, same as it earns no `GATES.md`. See `ledger:verifying`'s Proportion section for exactly where the manual-look/written-gate line falls.

## User Instructions Win

CLAUDE.md, AGENTS.md, and direct requests override skills; skills override default behavior.
