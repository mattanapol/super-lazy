# ledger

Superpowers' development methodology with unlazy's machine-checked
completion gates. Plan, test, and debug with process; prove done with exit
codes.

## Credit where it's due

This plugin is not original work. It is a merge of two existing projects,
and everything good in it came from one of them:

- **[obra/superpowers](https://github.com/obra/superpowers)** by Jesse Vincent —
  the development methodology. Brainstorming, planning, TDD, systematic
  debugging, the subagent fix loop with model escalation, and the collaboration
  patterns are all its work.
- **[Leonxlnx/unlazy](https://github.com/Leonxlnx/unlazy)** by Leonxlnx — the
  completion enforcement. Acceptance gates, the checker and its approval
  security model, ownership leases, dispatch waves, and the Stop hook are all
  its work, vendored here byte-identical.

The idea behind combining them is simple: each is weakest exactly where the
other is strong. Superpowers knows how work should be done but enforces it
only by prompt pressure — its `verification-before-completion` is a prose rule
nothing checks. Unlazy makes "done" a command's exit code but has no opinion
about how the work gets designed or tested in the first place. So this takes
superpowers' front half, unlazy's back half, and deletes the overlap.

Both are MIT licensed; see [`NOTICE`](NOTICE) for the exact versions, pinned
commits, and which parts are derived from which. If you only want one of them,
go install the original — they are both excellent, actively maintained, and
neither needs this.

## Install

```bash
git clone https://github.com/mattanapol/super-lazy
/plugin marketplace add ./super-lazy
/plugin install ledger
```

Claude Code only. Node ≥16. No third-party runtime dependencies.

## What's in it

Twelve skills. `using-ledger` is injected into every session by a
session-start hook and routes to the rest:

```
brainstorming → planning → executing → verifying → finishing-a-development-branch
```

plus `test-driven-development`, `systematic-debugging`, `using-git-worktrees`,
`requesting-code-review`, `receiving-code-review`, and `writing-skills`.

`planning`, `executing`, and `verifying` are the merged ones — they replace
five superpowers skills that unlazy's tooling supersedes.

## Enforcement

Installing delivers the skills and a session-start router. Nothing runs
or blocks on its own: gate discipline is prompt-level until you opt in,
per project, to the Stop hook — which structurally blocks the agent from
ending a turn while a gate is unmet:

```bash
/gates-enforce            # install
/gates-enforce --uninstall
```

## Provenance and vendoring

Merged from [obra/superpowers](https://github.com/obra/superpowers) 6.3.0
(`f2cbfbe`) and [Leonxlnx/unlazy](https://github.com/Leonxlnx/unlazy) 2.1.0
(`1667149`). Design rationale is in
[`docs/specs/2026-09-06-ledger-design.md`](docs/specs/2026-09-06-ledger-design.md).

Files under `scripts/`, `templates/`, and `references/` are vendored from
unlazy **byte-identical** and verified against `VENDOR.lock`. Do not hand-edit
them — run `tools/sync-unlazy.sh` to update, then re-run the vendored suite.
Keeping them unmodified is deliberate: it makes an upstream fix a re-copy
rather than a manual patch.

## Checks

```bash
npm test                        # this plugin's own tests + structure validator
npm run test:vendor             # unlazy's seven upstream suites, unmodified
node tools/check-plugin.mjs .   # structure only
tools/sync-unlazy.sh            # verify vendored files against VENDOR.lock
```

`npm run test:vendor` is the gate on `tools/sync-unlazy.sh --update`: if the
suite fails after an update, reject the update rather than patching vendored
code.

## Status

Built and reviewed, not yet battle-tested. See
[`docs/validation/2026-09-06-e2e-report.md`](docs/validation/2026-09-06-e2e-report.md)
for what is proven, what is assumed, and what is still untested — including the
one thing nobody has run yet, a live `/plugin install`.
