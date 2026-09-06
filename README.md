# ledger

Superpowers' development methodology with unlazy's machine-checked
completion gates. Plan, test, and debug with process; prove done with exit
codes.

## Install

```bash
/plugin marketplace add /Users/kaewsai/repos/temp2
/plugin install ledger
```

## Enforcement

Installing delivers the skills and a session-start router. Nothing runs
or blocks on its own: gate discipline is prompt-level until you opt in,
per project, to the Stop hook — which structurally blocks the agent from
ending a turn while a gate is unmet:

```bash
/gates-enforce            # install
/gates-enforce --uninstall
```

## Provenance

Merged from [obra/superpowers](https://github.com/obra/superpowers) 6.3.0
and [Leonxlnx/unlazy](https://github.com/Leonxlnx/unlazy) 2.1.0. Both MIT;
see `NOTICE`. Design rationale is in
`docs/specs/2026-09-06-ledger-design.md`.

Files under `scripts/`, `templates/`, and `references/` are vendored from
unlazy byte-identical and verified against `VENDOR.lock`. Do not hand-edit
them — run `tools/sync-unlazy.sh` to update.

## Checks

```bash
npm test                        # this plugin's own tests + structure validator
npm run test:vendor             # unlazy's seven upstream suites, unmodified
node tools/check-plugin.mjs .   # structure only
```

## Vendored suite

`npm run test:vendor` runs unlazy's seven upstream suites unmodified. It is
the gate on `tools/sync-unlazy.sh --update`: if the suite fails after an
update, reject the update rather than patching vendored code.
