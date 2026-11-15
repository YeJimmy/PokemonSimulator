---
description: Implement a task end-to-end: seams -> TDD -> code -> code-review -> commit -> report -> ask to push
---

Argument format: `<task-id>: <optional extra description>`. Everything before the FIRST `:` is the task ID (e.g. `15.2`). Everything after the FIRST `:` (all characters, may be empty) is an ADDITIONAL instruction from the user layered on top of the task — treat it as extra scope/constraints and incorporate it into the ACs you test against. If there is no `:` in the argument at all, the entire argument is the task ID and there is no extra description. Raw argument string: $ARGUMENTS

Implement the above task from this repo's GitHub issues, following AGENTS.md exactly.

Context: !`git status --short --branch`

Non-negotiable order of operations. Do not skip or reorder steps:

1. Identify the task issue by its ID prefix in the title (use `gh issue list --label task --state open --search "<task-id>: in:title"` or `gh issue view <number>` if you already know the number). Read its acceptance criteria, plus the governing user story for context. Note the issue number and task ID. If the extra description adds or tightens requirements, record them alongside the ACs — they are testable scope too.
2. If not already on it, create a branch for this task named after it (e.g. `6.2-combatant-state`) from the latest `main`. Never do task work directly on `main`. Move the issue's board status to In Progress.
3. Load the `tdd` skill (skill tool, id `tdd`). From the acceptance criteria ONLY, write the failing tests FIRST. Run `npm.cmd test` and show the failures (red). If the tests pass already, stop and reassess — the story or tests are misunderstood; do not proceed to implementation.
4. STOP. List the exact test seams where behavior will be verified (exported functions in src/battle.js / src/data.js, mocked Math.random, UMD export guards, the IPC boundary, manual app launch for src/app.js) and how each maps to the ACs. Wait for the user's explicit confirmation of the seams before writing any production code. Do not proceed on silence or on a story-level approval.
5. Only after seam confirmation: implement the change. Keep non-UI logic DOM-free in src/battle.js and src/data.js so it stays testable; src/app.js is verified manually. Run `npm.cmd test` and show the results (green).
6. Load the `code-review` skill (skill tool, id `code-review`) and review the changes since the branch point. Fix anything it surfaces, then re-run `npm.cmd test`.
7. If `npm.cmd test` is green and review has no blocking findings: make a local commit with a conventional single-line subject (body only if it adds context). Reference the task (e.g. `Part of #N`). Local commit is fine without asking.
8. Report honestly: what works (passing tests, what was verified), what has problems (failing tests, review findings, anything unverifiable such as DOM behavior without launching the app), and for each problem suggest concrete solutions or state what decision you need.
9. Finally ask the user whether they want to push and/or open a PR to `main`. NEVER run `git push`, open a PR, or force-push without the user's explicit approval for that specific action. If approved, follow AGENTS.md (PR references `Closes #N`, assignee/reviewer YeJimmy, board status updated).
