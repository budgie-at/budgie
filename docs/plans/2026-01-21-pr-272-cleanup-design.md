# PR #272 Cleanup Design

## Context

PR #272 implemented account preselection when creating transactions from the account details screen. During development, the implementation pivoted from a context-based approach to a simpler local state approach, leaving unused code in the context.

## Problem

1. **Dead context state**: `accountId` and `setAccountId` exist in `CreateActionContext` but are never used
2. **Dead TabTrigger**: `(tabs)/_layout.tsx` has a TabTrigger for `account/[id]/details` but this route moved to `(main)`
3. **Manual memoization**: Provider uses `useCallback`/`useMemo` which violates React 19 rules

## Solution

### 1. Clean up CreateActionContext

**File:** `packages/app/src/@generic/context/create-action.context.ts`

Remove `accountId` and `setAccountId` from the interface:

```typescript
interface CreateActionContextInterface {
    createAction: CreateActionInterface | null;
    setCreateAction: (action: CreateActionInterface | null) => void;
    isMenuOpen: boolean;
    openMenu: () => void;
    setIsMenuOpen: (isOpen: boolean) => void;
}
```

### 2. Clean up CreateActionProvider

**File:** `packages/app/src/@generic/provider/create-action.provider.tsx`

- Remove `accountId` state
- Remove `useCallback` for `openMenu` (React 19 Compiler handles memoization)
- Remove `useMemo` for value (React 19 Compiler handles memoization)

### 3. Clean up Tabs Layout

**File:** `packages/app/src/app/(tabs)/_layout.tsx`

- Remove `accountId` from context destructuring
- Remove `accountId` prop from `CreateTransactionMenu`
- Remove dead `TabTrigger name="account/[id]/details"`

## Verification

After changes:
- `yarn ts` - TypeScript check passes
- `yarn lint` - ESLint passes
- `yarn deadcode` - No dead code detected
- App still works: can create transactions from both tabs and account details page
