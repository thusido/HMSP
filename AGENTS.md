# HMSP agent workflow
Git local-first (GitHub = mirror): commit per unit, WIP stays local,
push at completion (auto, no ask). Pre-commit: status/diff review,
no secrets/binaries, tsc+test green. Never amend pushed commits.
Verify: `pnpm exec tsc -b`, `pnpm test`, `pnpm build`,
`rg 'w-\[.*px\]|min-w-\[|text-\[[0-9]+px\]' src` must be empty.
Respond in Korean, minimal diffs. Fresh clone: see readme "Reproduce from git".
Session start with no prior context: read docs/HANDOFF.md first, then proceed.
Session close: update docs/HANDOFF.md (position, next, new gotchas).
