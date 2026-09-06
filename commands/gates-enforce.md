---
description: Install or remove the Stop hook that blocks turn completion while gates are unmet. Opt-in, per project.
---

Install the ledger Stop hook for THIS project only.

The hook returns Claude Code's top-level `decision: "block"` while the
session's resolved pipeline has unmet gates or incomplete dispatch waves.
Its progress guard releases after six no-progress blocks, so it cannot
wedge a session.

1. Explain to the user what installing this changes: the agent becomes
   structurally unable to end a turn while a required gate is unmet. This
   is opt-in and per project, and it writes machine-specific absolute
   paths into `.claude/settings.local.json` — that file must stay
   untracked and does not port between machines.

2. Confirm the user still wants it. Never install without explicit
   consent.

3. Check how many pipelines this project has before installing anything:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/gate-check.mjs" --list-scopes
   ```

   - **Zero or one scope printed.** The hook resolves its pipeline on its
     own at Stop time (the single scope, or the legacy `GATES.md` /
     `gates/*.md` layout at the project root). Installing without
     `--scope` is safe. Skip to step 4.
   - **Two or more scopes printed.** Installing bare is unsafe here: with
     more than one pipeline and nothing bound to the session, the hook
     logs "not blocking" and allows the stop — silent non-enforcement
     that looks identical to a passing session. Do not install without
     doing one of the following. Ask the user which scope this session's
     work belongs to, then either:
     - **Pin this project's hook to one pipeline, for every session:**
       ```bash
       node "${CLAUDE_PLUGIN_ROOT}/scripts/install-hooks.mjs" --scope <ID>
       ```
       This bakes `--scope <ID>` into the installed command. Every
       session in this project blocks against `<ID>` until the hook is
       reinstalled with a different scope.
     - **Bind only the current session, leaving other sessions free to
       bind their own scope:**
       ```bash
       node "${CLAUDE_PLUGIN_ROOT}/scripts/gate-check.mjs" --bind "$CLAUDE_CODE_SESSION_ID" --scope <ID>
       ```
       Install the hook without `--scope` (step 4's default form) and
       repeat this `--bind` once per session. A session that never binds,
       in a project with more than one scope, still will not block. If
       `$CLAUDE_CODE_SESSION_ID` is unset in this environment, ask the
       user for the session id instead of guessing one, or fall back to
       the pin-to-one-pipeline option above.

4. If `$ARGUMENTS` contains `--uninstall`, run:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/install-hooks.mjs" --uninstall
   ```

   Otherwise run the install chosen in step 3 (bare, or with `--scope <ID>`):

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/install-hooks.mjs"
   ```

5. Read back the resulting `.claude/settings.local.json` and confirm to the
   user whether a Stop hook entry is present. Report the actual file
   contents — do not claim success from the installer's exit code alone.
   If step 3 found more than one scope, also confirm either the printed
   `command` field carries `--scope <ID>`, or that `--bind` was run for
   this session — otherwise this is a hook that will not block.

6. Remind the user that `.claude/settings.local.json`, `.unlazy/`, and
   `.unlazy-hook-state.json` belong in `.gitignore`. This plugin's own
   `.gitignore` already lists them.
