# Transaction Info Page Implementation Plan

> **For agentic workers:** Execute task-by-task. Keep existing root checkout changes untouched; work only in `/Users/vitalyiegorov/budgie-1/.worktrees/transaction-info-page`.

**Goal:** Existing transaction taps open a read-only Transaction info page for expense, income, and transfer transactions, with edit forms moved behind explicit Edit transaction buttons.

**Architecture:** Existing route URLs become info pages. Existing edit form code moves to nested `/edit` routes. A small set of transaction info components renders the hero, detail rows, action footer, and similar-history block from existing transaction relations plus one bounded repository query.

**Tech Stack:** Expo Router, React Native, NativeWind class names, Drizzle live queries, Lingui macros, Maestro E2E.

---

## Tasks

### Task 1: Route And E2E Red Step

- Update transaction E2E flows so tapping an existing transaction expects `TransactionInfo.Page`, then taps `TransactionInfo.EditButton` before interacting with the old form.
- Add assertions for expense, income, transfer, and cross-currency transfer info fields.
- Run one targeted flow enough to confirm the new expectations fail before implementation.

### Task 2: Move Existing Forms To Edit Routes

- Move current `expense.tsx`, `income.tsx`, and `transfer.tsx` form implementations to:
  - `packages/app/src/app/(main)/transactions/[id]/expense/edit.tsx`
  - `packages/app/src/app/(main)/transactions/[id]/income/edit.tsx`
  - `packages/app/src/app/(main)/transactions/[id]/transfer/edit.tsx`
- Keep adjustment route unchanged.
- Keep parent-consolidation redirects in both info and edit paths.

### Task 3: Build Transaction Info Components

- Create transaction info selectors, props interfaces, row components, hero component, footer component, tag row, and page shell.
- Reuse `CircleIcon`, `Button`, `TransactionFeePill`, `RefundedPill`, `MatchingRulesPill`, and existing modal hooks.
- Do not make detail rows open field-specific editors in this version; all editing goes through the footer button.

### Task 4: Add Similar Transactions Query

- Add repository method for bounded similar transaction monthly stats.
- Add app query hook and period enum.
- Start with expense/income similar history; hide transfer similar history unless same from/to account transfer history becomes required later.
- Match by title when title exists; otherwise match same category/account/comment fallback.

### Task 5: Wire Info Routes

- Replace `expense.tsx`, `income.tsx`, and `transfer.tsx` with thin info route files.
- Use existing action hooks for delete, revert, convert-to-transfer, convert-to-refund, refund sources, and consolidation sources.
- Edit button routes to the nested `/edit` route.

### Task 6: Validation

- Run `yarn format`.
- Run `yarn ts`.
- Run targeted transaction Maestro flows after rebuilding E2E app if source changes require it.
- Run full validation if time allows: `yarn lint`, `yarn deadcode`, `yarn cpd`.
