# Project instructions (AGENTS.md template)
# Copy to a new repo and replace every {{PLACEHOLDER}} before committing.
# Delete sections that do not apply; keep the guardrails intact.

## Workflow: read before implementing ANYTHING

1. Check the GitHub issues and the project board ({{BOARD_URL}}) before starting any feature work. Use `gh issue list --state open`. The issues are the source of truth for what is planned and done.
2. New work is defined as **user stories with acceptance criteria**, filed as GitHub issues labeled `user-story`. Number them sequentially after the last existing US. Never implement beyond what the ACs describe.
3. Stories are broken into **tasks** filed as issues labeled `task`, with **hierarchical IDs that reset per story**. A new story takes the next US number and its tasks start at `<n>.1`.
4. Acceptance criteria describe **what the user notices is different**, not internal implementation details. Implementation steps belong in task issues.
5. Confirm the story with the user before coding. Move the issue's board status through Todo, In Progress and Done as work progresses; reference `Closes #N` in the PR so merging closes the story.

## Guardrails: hard rules

- **TDD always.** For every new feature or behavior change: write the failing tests from the ACs first, show them red, then implement, then show them green. `{{TEST_COMMAND}}` must be green before committing. Never skip the red step silently. If the tests already pass before implementation, the story wasn't understood, so stop and reassess.
- **Branch per task.** Every task is implemented on its own branch named after the task, e.g. `6.1-short-description`. Branch from the latest `main`; never do task work directly on `main`. When the task is complete and `{{TEST_COMMAND}}` is green, propose opening a PR to `main`. Opening it requires explicit user approval (see push rule).
- **Push and PRs need explicit approval.** Local commits are fine without asking. Never run `git push`, open/merge a PR, or force-push without explicit user approval for that specific action. **Never push directly to `main`** — all work reaches `main` via a branch and a PR. If you believe a direct push to `main` is the better alternative in a specific case, say why and ask the user beforehand; do it only with explicit approval.
- **Issues and PRs carry ownership.** Every issue or PR created (or edited materially) gets: assignee `{{GITHUB_HANDLE}}`, reviewer requested `{{GITHUB_HANDLE}}` when possible, labels chosen to fit the work (`user-story`, `task`, `enhancement`, `bug`), and the item added to the project board with an accurate status (Todo, In Progress, Done). Apply this to both issues and PRs.
- **Show test seams, then ask.** Before any coding for a task, list the exact seams where behavior will be verified and how each maps to the ACs. Wait for the user's explicit confirmation before writing any code. Approving a story-level plan is NOT approval to start a task, and approving one task is NOT approval for the next. If no seam exists for a new behavior, create one and call it out explicitly.
- **Simple, readable, in scope.** Prefer the simplest, most readable implementation that satisfies the ACs: boring code over cleverness, no speculative abstraction, no gold-plating, no drive-by refactors. Stay within the confines of the task; if something outside the task seems necessary, stop and ask the user first instead of doing it.
- **Finish, report, then ask.** When a task is implemented, run `{{TEST_COMMAND}}`, report the outcome honestly (pass/fail counts and anything you had to change), and ask the user whether the work looks correct or needs modifying. Only after the user is satisfied with the report may you propose a push or PR.

## Build & test commands

```powershell
{{BUILD_COMMAND}}   # install dependencies
{{START_COMMAND}}   # run the app / dev server
{{TEST_COMMAND}}    # run the test suite; must be green before committing
```

## Engineering rules

- {{PROJECT_STRUCTURE}}   # e.g. which directories hold non-UI logic, which hold UI, and how tests import them
- Test-first is mandatory; see Guardrails.
- {{DOMAIN_FACTS}}        # e.g. data formats, stat formulas, external APIs the project relies on
- Generated files must never be hand-edited; change the generator, not the output.
- Issue and PR bodies are written ASCII-only. Beware tools that write a BOM (e.g. PowerShell `Set-Content -Encoding utf8`); verify a file's first bytes if unsure (EF BB BF means BOM).
- After a PR merges: pull the latest `main`, confirm `{{TEST_COMMAND}}` is green, flip the board items to Done, and delete the task branch if the user wants it deleted.

## Commits

- Conventional, single-line subject; body when it adds context.
- Never commit `node_modules/` (or your dependency/build directories).
