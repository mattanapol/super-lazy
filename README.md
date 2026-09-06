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

Gates are active on install. The Stop hook — which structurally blocks the
agent from ending a turn while a gate is unmet — is opt-in per project:

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
npm test                          # vendored unlazy suite + plugin validator
node tools/check-plugin.mjs .   # structure only
```
