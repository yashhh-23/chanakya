# AI Agent Guidelines & Documentation Rules

This file defines the conventions for development, commits, and automated documentation updates for the **TransitOps (Chanakya)** project. It lives at the repo root so AI agents and humans can find it without being told where to look. See `docs/TransitOps_PRD.md` for the full context behind these rules.

## 1. Commit Message Conventions

All commits must follow these prefixes to ensure the automated documentation bot can categorize changes correctly:

- `FEATURE: {description}` - New features or capabilities.
- `BUG: {description}` - Fixes for bugs or build errors.
- `UI: {description}` - Visual changes, layout fixes, or styling updates.
- `PERF: {description}` - Performance optimizations.
- `SEC: {description}` - Security related changes.
- `DOCS: {description}` - Changes to documentation files.
- `REFACTOR: {description}` - Code changes that neither fix a bug nor add a feature.
- `TEST: {description}` - Adding missing tests or correcting existing tests.
- `CHORE: {description}` - Updates to build scripts, dependencies, etc.

Commits are rejected by CI's commit-lint step if they don't match `^(FEATURE|BUG|UI|PERF|SEC|DOCS|REFACTOR|TEST|CHORE):`.

**Linking to the PRD**: a commit may include a trailer `Closes-PRD-Section: §X.Y` to signal that a functional requirement is now complete. The docs bot uses this to update `docs/Implementation_Status.md` automatically.

## 2. Documentation Updates & AI Agent Behavior

When an AI Agent is working on this project, it must:

1. **Consult Documentation First**: Always read `docs/TransitOps_PRD.md` for requirements and `docs/Implementation_Status.md` for current progress before starting new features.
2. **Maintenance**: The AI Agent and GitHub Bot are jointly responsible for maintaining the following files in `docs/`:
    - **CHANGELOG.md**: Must be updated after every significant change or commit that passes CI.
        - `FEATURE` maps to `### Added`
        - `BUG`, `UI` map to `### Fixed`
        - `REFACTOR`, `PERF`, `SEC`, `DOCS` map to `### Changed`
        - `TEST`, `CHORE` map to `### Internal`
    - **Build_Issue_Report.md**: Specifically for `BUG` commits that relate to compilation, CI config, or environment issues.
    - **Implementation_Status.md**: Updated when a feature mentioned in the PRD is moved to completion — in the same commit that completes it, not a later cleanup pass.
    - **commit-log/YYYY-MM-DD.md**: An append-only, per-day audit log of every commit that passed CI on `main`. Never edited or rewritten after creation.

## 3. GitHub Automation

A GitHub Action (`.github/workflows/docs-bot.yml`) should be configured to:

1. Trigger via `workflow_run` on completion of CI against `main`, filtered to `conclusion == 'success'`. **A commit is only logged once CI has actually passed.**
2. Parse the commit message prefix and append an entry to `docs/CHANGELOG.md` under the mapped heading.
3. Append an entry to `docs/commit-log/YYYY-MM-DD.md` (created if it doesn't exist for that day).
4. If the commit is prefixed `BUG` and touches CI/build/infra files, also append to `docs/Build_Issue_Report.md`.
5. If the commit body contains `Closes-PRD-Section: §X.Y`, update the corresponding row in `docs/Implementation_Status.md` and link the commit SHA as evidence.
6. Commit the documentation changes back to the repository as a single bot commit (`DOCS: automated changelog/status update for {sha}`).
7. On failure to push, retry once with a rebase, then open a `CHORE`-tagged issue rather than silently dropping the update. The bot never force-pushes and never rewrites existing `commit-log/` files.
