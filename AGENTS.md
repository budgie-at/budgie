# AGENTS.md

Budgie: Offline-first mobile expenses tracker.

## Quick Reference

- **Package manager:** yarn (never npm)
- **Validate before commit:** `yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd`
- **Build all:** `yarn build`

## Packages

| Package | Path | Purpose |
|---------|------|---------|
| app | `packages/app` | React Native (Expo 54) mobile app |
| contracts | `packages/contracts` | Shared types, schemas, repositories |
| landing | `packages/landing` | Next.js 15 marketing site |
| bank-sync | `packages/bank-sync` | Bank integration APIs |

## Documentation

- [TypeScript Conventions](.claude/docs/typescript-conventions.md)
- [Code Style](.claude/docs/code-style.md)
- [Architecture](.claude/docs/architecture.md)
- [Git Workflow](.claude/docs/git-workflow.md)

Each package has its own `AGENTS.md` with package-specific rules.
