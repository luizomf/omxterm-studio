# OMXTerm Studio

A frontend-only theme and configuration workshop, separate from the OMXTerm desktop application and OMXTerm Web SSH broker.

- Chat in the user's language; code, documentation, issues, and commits in English.
- Use the smallest complete implementation. Do not add a backend, real shell, telemetry, third-party theme catalog, or font-file access without explicit scope.
- Read `docs/spec.md` before changing behavior. Preserve strict OMXTerm version-1 configuration and theme formats; clearly disclose browser-preview limitations.
- Never publish private terminal payload, screenshots, paths, credentials, or user configurations. Demo content must be fictional.
- Work through an issue, exclusive branch/worktree, and reviewed PR. Bootstrap is the only initial-main exception. New worktrees belong under `~/sannux-data/worktrees/omxterm-studio/`.
- Preserve unrelated work. Run `npm run check` and relevant browser tests before integration. Do not weaken tests to get a pass.
- Prefer one responsible implementer and a fresh independent reviewer. Ask for the review model mapping before delegation unless the user has supplied it; obey harness routing rules.
- GitHub Pages serves static assets only. Publishing and repository visibility changes require explicit user authorization. Never claim a deployment succeeded without checking the actual public site.
- Keep imported data local; do not log it, execute it, or turn paths into fetch requests. Treat local storage and JSON as untrusted input.
