# Project instructions for PokemonSimulator

## Workflow — read before implementing ANYTHING

1. Read `docs/user-stories.md` and `docs/tasks.md` before starting any feature work.
2. New features are defined as **user stories with acceptance criteria** in `docs/user-stories.md` — number them sequentially after the last existing US (currently US-11). Never implement beyond what the ACs describe.
3. Break each story into tasks in `docs/tasks.md`, numbered after the last existing task (currently T-34).
4. Acceptance criteria describe **what the user notices is different**, not internal implementation details. Implementation steps belong in tasks.
5. Confirm the story with the user before coding. Update `docs/tasks.md` status as work completes.

## Guardrails — hard rules

- **TDD always.** For every new feature or behavior change: write the failing tests from the ACs first, show them red, then implement, then show them green. `npm.cmd test` must be green before committing. Never skip the red step silently — if the tests already pass before implementation, the story wasn't understood, so stop and reassess.
- **Branch per task.** Every task is implemented on its own branch named after the task, e.g. `T-35-regenerate-roster`. Branch from the latest `main`; never do task work directly on `main`. When the task is complete and `npm.cmd test` is green, propose opening a PR to `main` — opening it requires explicit user approval (see push rule).
- **Push and PRs need explicit approval.** Local commits are fine without asking. Never run `git push`, open/merge a PR, or force-push without explicit user approval for that specific action.
- **Show test seams, then ask.** When you propose or are asked for an implementation plan, first list the *test seams* — the exact points where behavior will be verified (exported functions, mocked `Math.random`, the UMD export guards, the IPC boundary, manually launched app for DOM) — and ask the user whether they're okay with that approach before writing any code. If no seam exists for a new behavior, create one and call it out explicitly.

## Build & test commands (this machine)

`npm` is blocked by PowerShell execution policy — always use `npm.cmd`:

```powershell
npm.cmd install   # install deps
npm.cmd start     # launch the Electron app
npm.cmd test      # run the test suite (node --test, 22+ tests must pass)
```

## Engineering rules

- `src/battle.js` and `src/data.js` contain all non-UI logic and are imported by `test/` via a UMD-style guard. Keep them DOM-free so they stay testable.
- `src/app.js` is the DOM layer; tests don't cover it — verify manually by launching the app.
- Test-first is mandatory — see Guardrails. `src/app.js` (DOM layer) is verified manually by launching the app.
- PokemonData.txt is whitespace-separated with a header row; stats are level-100 max-IV/max-EV neutral values (HP = 2×base+204, others = 2×base+99).
- Sprites come from the PokéAPI sprite CDN at runtime; sprites require internet access.
- The legacy `Pokemon.js` is kept for reference — do not extend it, the app supersedes it.

## Commits

- Conventional, single-line subject; body when it adds context.
- Never commit `node_modules/`.
