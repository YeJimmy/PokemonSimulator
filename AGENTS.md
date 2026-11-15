# Project instructions for PokemonSimulator

## Workflow: read before implementing ANYTHING

1. Check the GitHub issues and the [project board](https://github.com/users/YeJimmy/projects/1) before starting any feature work. Use `gh issue list --state open`. The issues are the source of truth for what is planned and done; there is no markdown story/task file.
2. New work is defined as **user stories with acceptance criteria**, filed as GitHub issues labeled `user-story`. Number them sequentially after the last existing US (currently US-15; check `gh issue list` for the latest). Never implement beyond what the ACs describe.
3. Stories are broken into **tasks** filed as issues labeled `task`, with **hierarchical IDs that reset per story**. Tasks under US-6 are `6.1`, `6.2` and so on. A new story takes the next US number and its tasks start at `<n>.1`.
4. Acceptance criteria describe **what the user notices is different**, not internal implementation details. Implementation steps belong in task issues.
5. Confirm the story with the user before coding. Move the issue's board status through Todo, In Progress and Done as work progresses; reference `Closes #N` in the PR so merging closes the story.

## Guardrails: hard rules

- **TDD always.** For every new feature or behavior change: write the failing tests from the ACs first, show them red, then implement, then show them green. `npm.cmd test` must be green before committing. Never skip the red step silently. If the tests already pass before implementation, the story wasn't understood, so stop and reassess.
- **Branch per task.** Every task is implemented on its own branch named after the task, e.g. `6.1-combatant-state`. Branch from the latest `main`; never do task work directly on `main`. When the task is complete and `npm.cmd test` is green, propose opening a PR to `main`. Opening it requires explicit user approval (see push rule).
- **Push and PRs need explicit approval.** Local commits are fine without asking. Never run `git push`, open/merge a PR, or force-push without explicit user approval for that specific action.
- **Issues and PRs carry ownership.** Every issue or PR created (or edited materially) gets: assignee `YeJimmy`, reviewer requested `YeJimmy` when possible (GitHub forbids requesting review from the PR author, so for our same-account PRs the review gate is always the user's explicit merge approval), labels chosen to fit the work (`user-story`, `task`, `enhancement`, `bug`), and the item added to project board "PokemonSimulator" with an accurate status (Todo, In Progress, Done). Apply this to both issues and PRs.
- **Show test seams, then ask.** Before any coding for a task, list the exact seams where behavior will be verified (exported functions, mocked `Math.random`, the UMD export guards, the IPC boundary, manually launched app for the DOM) and how each maps to the ACs. Wait for the user's confirmation before writing any code. Approving a story-level plan is NOT approval to start a task, and approving one task is NOT approval for the next. If no seam exists for a new behavior, create one and call it out explicitly.
- **Finish, report, then ask.** When a task is implemented, run `npm.cmd test`, report the outcome honestly (pass/fail counts and anything you had to change), and ask the user whether the work looks correct or needs modifying. Only after the user is satisfied with the report may you propose a push or PR.

## Build & test commands (this machine)

`npm` is blocked by PowerShell execution policy. Use `npm.cmd`:

```powershell
npm.cmd install   # install deps
npm.cmd start     # launch the Electron app
npm.cmd test      # run the test suite (node --test, suite must be green)
```

## Engineering rules

- `src/battle.js` and `src/data.js` contain all non-UI logic and are imported by `test/` via a UMD-style guard. Keep them DOM-free so they stay testable.
- `src/app.js` is the DOM layer; tests don't cover it. Verify manually by launching the app.
- Test-first is mandatory; see Guardrails. `src/app.js` (DOM layer) is verified manually by launching the app.
- PokemonData.txt is whitespace-separated with a header row; stats are level-100 max-IV/max-EV neutral values (HP = 2×base+204, others = 2×base+99).
- Sprites come from the PokéAPI sprite CDN at runtime; sprites require internet access.
- Generated files must never be hand-edited: `PokemonData.txt` and `src/spriteIds.generated.js` are produced by `scripts/generate-pokemon-data.js`. Change the generator, not the output.
- Issue and PR bodies are written ASCII-only (write the file with Node, not PowerShell). PowerShell's `Set-Content -Encoding utf8` writes a BOM and mangles multi-byte characters; never use it for Markdown or source files. Verify a file's first bytes if unsure (EF BB BF means BOM).
- After a PR merges: `git pull origin main`, confirm `npm.cmd test` is green, flip the board items to Done, and delete the task branch if the user wants it deleted.
- The legacy `Pokemon.js` is kept for reference. Do not extend it; the app supersedes it.

## Commits

- Conventional, single-line subject; body when it adds context.
- Never commit `node_modules/`.
