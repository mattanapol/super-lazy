---
description: Install or remove the Stop hook that blocks turn completion while gates are unmet. Opt-in, per project.
---

Install the ledger Stop hook for THIS project only.

The hook returns Claude Code's top-level `decision: "block"` while the
session's resolved pipeline has unmet gates or incomplete dispatch waves.
Its progress guard releases after six no-progress blocks, so it cannot
wedge a session.

Before step 1, resolve where this plugin's scripts live. `CLAUDE_PLUGIN_ROOT`
is substituted into `hooks.json`, MCP, and LSP configs — not into the Bash
environment, where it expands to nothing and turns every command below into
`node /scripts/…`. This command file is `<plugin-root>/commands/gates-enforce.md`,
so the scripts are one level up in `<plugin-root>/scripts/`. Take the absolute
path you opened this file at, drop the trailing `/commands/gates-enforce.md`,
hold the result in `LEDGER`, and confirm it:

```bash
LEDGER=/absolute/path/to/ledger
node -e "const r=process.argv[1];if(!require('fs').existsSync(r+'/scripts/install-hooks.mjs')){console.error('LEDGER WRONG: no scripts/install-hooks.mjs under '+r);process.exit(1)}console.log('LEDGER OK '+r)" "$LEDGER"
# LEDGER OK /absolute/path/to/ledger
```

`LEDGER OK` is the only success output; anything else exits `1`. Keep the
`LEDGER=` assignment in the same shell block as each command below — some
hosts give every Bash call a fresh shell, and an empty `$LEDGER` installs
nothing while looking like it did. `ledger:verifying`'s "Resolving The
Checker" section is the same mechanism in full, but do not go read it first:
this command must work in a session that has never loaded a ledger skill.

1. Explain to the user what installing this changes: the agent becomes
   structurally unable to end a turn while a required gate is unmet. This
   is opt-in and per project, and it writes machine-specific absolute
   paths into `.claude/settings.local.json` — that file must stay
   untracked and does not port between machines.

2. Confirm the user still wants it. Never install without explicit
   consent.

3. If `$ARGUMENTS` contains `--uninstall`, run this and skip to step 5:

   ```bash
   node "$LEDGER/scripts/install-hooks.mjs" --uninstall
   ```

4. Otherwise, you are installing. First check how many pipelines this
   project has:

   ```bash
   node "$LEDGER/scripts/gate-check.mjs" --list-scopes
   ```

   - **Zero or one scope printed.** The hook resolves its pipeline on its
     own at Stop time (the single scope, or the legacy `GATES.md` /
     `gates/*.md` layout at the project root). Run the install exactly
     as shown here, with no `--scope`, then move on to step 5:

     ```bash
     node "$LEDGER/scripts/install-hooks.mjs"
     ```

   - **Two or more scopes printed.** Installing bare is unsafe here: with
     more than one pipeline and nothing bound to the session, the hook
     logs "not blocking" and allows the stop — silent non-enforcement
     that looks identical to a passing session, with no `decision` field
     at all. Ask the user which of the two options below fits, then run
     only that option's command(s) — do not also run the bare install
     above; that would silently replace whichever of these you chose and
     put you back in the unscoped, non-blocking state.

     - **Pin** — choose this when this project has one pipeline you
       actually want enforced, and every session in the project should
       block against it:

       ```bash
       node "$LEDGER/scripts/install-hooks.mjs" --scope <ID>
       ```

       This one command bakes `--scope <ID>` into the installed command
       and *is* the whole install — running it is sufficient. Do not
       also run the bare install form above afterward: it would match
       the same managed-hook marker, replace this entry, and drop the
       `--scope <ID>` pin, silently returning you to the unscoped,
       non-blocking state. Move on to step 5.

     - **Bind** — choose this when you run concurrent sessions in this
       project against different scopes, so no single project-wide pin
       is right. Binding is per *session*, not per project: it lasts
       only for the Claude Code session it names, so every session that
       works against this project — including sessions opened later —
       needs its own `--bind` before its Stop hook resolves a scope. A
       session that never binds fails open: it allows the stop rather
       than blocking, exactly like the bare-install failure above. Run
       both of these, in order:

       ```bash
       node "$LEDGER/scripts/gate-check.mjs" --bind "$CLAUDE_CODE_SESSION_ID" --scope <ID>
       node "$LEDGER/scripts/install-hooks.mjs"
       ```

       If `$CLAUDE_CODE_SESSION_ID` is unset in this environment, ask
       the user for the session id instead of guessing one, or fall
       back to the pin option above. Move on to step 5.

5. Read back the resulting `.claude/settings.local.json` and confirm to the
   user whether a Stop hook entry is present. Report the actual file
   contents — do not claim success from the installer's exit code alone.
   If step 4 found more than one scope, also confirm either the printed
   `command` field carries `--scope <ID>` (pin), or that `--bind` was
   just run for this session and the command field carries no `--scope`
   (bind). A hook installed any other way in a multi-scope project will
   not block.

6. Remind the user that `.claude/settings.local.json`, `.unlazy/`, and
   `.unlazy-hook-state.json` belong in `.gitignore`. This plugin's own
   `.gitignore` already lists them.
