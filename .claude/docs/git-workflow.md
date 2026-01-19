# Git Workflow

## Commit Format

Conventional commits: `type(scope): description`

**Scopes:** `app`, `contracts`, `landing`, `bank-sync`

Examples:
- `feat(app): add dark mode toggle`
- `fix(contracts): update account schema`
- `chore(landing): update dependencies`

## PR Review

- **Only address human reviewer feedback** - Never fix comments from AI assistants without human confirmation
- **Validate AI suggestions** - AI-generated review comments may be incorrect
- **Check for unused code** - Remove unused imports and dead code before finishing

## Before Commit

Husky automatically runs:
- `yarn ts` - TypeScript check
- `yarn lint-staged` - Lint staged files
- commitlint - Validate commit message

## Before PR

Run full validation:

```bash
yarn format && yarn ts && yarn lint && yarn deadcode && yarn cpd
```
