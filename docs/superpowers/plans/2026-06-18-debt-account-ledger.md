# Debt Account Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make lent and borrowed debt accounts calculate outstanding amounts, returned/repaid amounts, progress, home tiles, detail headers, and completed state from one robust ledger summary.

**Architecture:** Debt progress is derived from debt-type-aware ledger direction first, with `targetBalance` as the original principal denominator and signed balance only as a no-ledger fallback. The contracts repository exposes canonical debt summary fields so home data and detail data agree, while React components render precomputed summaries instead of fetching raw debit/credit totals per card.

**Tech Stack:** TypeScript, React Native, Expo Router, Drizzle ORM, SQLite, Lingui, Vitest scenario tests, Maestro iOS E2E.

---

## File Map

- Modify `tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts`: add red tests for stale signed snapshots, corrected lent starting value plus attached income, borrowed repayment/additional-borrowing mirror behavior, completed debt, and repository summary fields.
- Modify `packages/app/src/account/utils/build-debt-account-progress-summary.util.ts`: calculate debt outstanding from opened/closed ledger entries when entries exist; keep signed balance as fallback only.
- Modify `packages/app/src/account/interface/debt-account-progress-summary-params.interface.ts`: keep current input fields and document source fields through names used by the utility.
- Create `packages/app/src/account/interface/debt-account-progress-summary.interface.ts`: shared UI summary contract for debt detail and home cards.
- Modify `packages/contracts/src/account-balance/repository/account-balance.repository.ts`: add SQL helpers for debt opened/closed/outstanding/paid/total/percentage and expose these fields in `getHomeAccountRows`, `getTotalRemainingDebtByType`, and a new per-account detail query.
- Modify `packages/app/src/account/interface/home-account-balance.interface.ts`: add `debtProgressSummary`.
- Modify `packages/app/src/account/query/use-home-page-data.query.ts`: build `debtProgressSummary` from repository fields and debt totals from the same summary.
- Create `packages/app/src/account/query/use-debt-account-progress-summary.query.ts`: live-query one debt account summary for the details screen.
- Delete `packages/app/src/account/query/use-debt-account-ledger-totals.query.ts`: remove the old raw total hook after all imports are gone.
- Modify `packages/app/src/app/(main)/account/[id]/details.tsx`: consume the canonical summary hook for debt accounts.
- Modify `packages/app/src/account/component/debt-account-balance/debt-account-balance.tsx`: render a `DebtAccountProgressSummaryInterface` instead of recomputing from raw balance/debit/credit/target.
- Create `packages/app/src/account/component/debt-account-balance/debt-account-balance.selector.ts`: stable Maestro selectors for outstanding, paid, total, and percentage.
- Modify `packages/app/src/account/component/account-grid-row/account-grid-row.tsx`: pass the full balance row into grid items.
- Modify `packages/app/src/account/component/account-grid-item/account-grid-item.tsx`: pass the debt summary from home data into cards.
- Modify `packages/app/src/account/component/account-card/account-card.tsx`: thread optional debt summary to `DebtAccountCard`.
- Modify `packages/app/src/account/component/debt-account-card/debt-account-card.tsx`: remove per-card ledger hook and render the provided summary.
- Modify `packages/app/src/account/component/debt-account-card-summary/debt-account-card-summary.tsx`: accept account title for selectors and expose outstanding/target/percentage test IDs.
- Create `packages/app/src/account/component/debt-account-card-summary/debt-account-card-summary.selector.ts`: stable Maestro selectors for home debt tiles.
- Modify `packages/app/src/account/service/account.service.ts`: create balance adjustment entries before updating the balance snapshot and read current balance through the transaction handle.
- Modify `tests/app-tests/flows/subflows/accounts/create-debt-account.flow.yaml`: support an explicit `CURRENT_BALANCE`.
- Modify `tests/app-tests/flows/03.account-debt-lent.flow.yaml`, `tests/app-tests/flows/04.account-debt-borrowed.flow.yaml`, and `tests/app-tests/flows/31.debt-settlement-attachments.flow.yaml`: pass `CURRENT_BALANCE`.
- Modify `tests/app-tests/flows/31.debt-settlement-attachments.flow.yaml`: assert exact lent, borrowed, and completed debt status values through selectors.
- Run validation commands from `AGENTS.md`.

---

### Task 1: Add Red Tests For Debt Ledger Semantics

**Files:**
- Modify `tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts`

- [ ] **Step 1: Add stale-snapshot tests for the summary utility**

Insert these tests after `summarizes lent debt returns from the returned amount input and attached income`:

```ts
    it('uses lent ledger entries instead of a stale signed balance when debt activity exists', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.LENT,
            balance: 1_891 * PRECISION,
            debitAmount: 13_000 * PRECISION,
            creditAmount: 109 * PRECISION,
            targetAmount: 15_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 12_891 * PRECISION, 2_109 * PRECISION, 15_000 * PRECISION, 14.06);
    });

    it('uses borrowed ledger entries instead of a stale signed balance when debt activity exists', () => {
        const summary = buildDebtAccountProgressSummary({
            debtType: AccountDebtTypeEnum.BORROW,
            balance: -1_891 * PRECISION,
            debitAmount: 2_109 * PRECISION,
            creditAmount: 15_000 * PRECISION,
            targetAmount: 15_000 * PRECISION
        });

        expectDebtProgressSummary(summary, 12_891 * PRECISION, 2_109 * PRECISION, 15_000 * PRECISION, 14.06);
    });
```

- [ ] **Step 2: Add corrected-starting-value plus attached-income integration test**

Insert this test after the stale-snapshot tests:

```ts
    it('summarizes lent debt after correcting returned amount and attaching income', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = await createDebtAccount(AccountDebtTypeEnum.LENT, 0, 15_000, cashAccount.instrumentId);

        await accountService.updateDebtById(debtAccount.id, {
            debtType: AccountDebtTypeEnum.LENT,
            currentBalance: 2_000,
            targetBalance: 15_000
        });

        const transaction = createIncomeTransaction(cashAccount.id, category.id, 109 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const summary = buildSummaryFromDebtAccount(debtAccount, AccountDebtTypeEnum.LENT);

        expectDebtProgressSummary(summary, 12_891 * PRECISION, 2_109 * PRECISION, 15_000 * PRECISION, 14.06);
    });
```

- [ ] **Step 3: Add borrowed mirror integration test**

Insert this test after `counts debt repayments once in expense analytics while updating the borrowed debt balance`:

```ts
    it('summarizes borrowed debt after repayment expense and additional borrowed income', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = await createDebtAccount(AccountDebtTypeEnum.BORROW, 15_000, 15_000, cashAccount.instrumentId);
        const repayment = createExpenseTransaction(cashAccount.id, category.id, 2_000 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: repayment.id, debtAccountId: debtAccount.id });

        const additionalBorrowing = createIncomeTransaction(cashAccount.id, category.id, 109 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: additionalBorrowing.id, debtAccountId: debtAccount.id });

        const summary = buildSummaryFromDebtAccount(debtAccount, AccountDebtTypeEnum.BORROW);

        expectDebtProgressSummary(summary, 13_109 * PRECISION, 1_891 * PRECISION, 15_000 * PRECISION, 12.61);
    });
```

- [ ] **Step 4: Add completed debt integration test**

Insert this test after the borrowed mirror test:

```ts
    it('summarizes fully returned lent debt as complete', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = await createDebtAccount(AccountDebtTypeEnum.LENT, 0, 300, cashAccount.instrumentId);
        const transaction = createIncomeTransaction(cashAccount.id, category.id, 300 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const summary = buildSummaryFromDebtAccount(debtAccount, AccountDebtTypeEnum.LENT);

        expectDebtProgressSummary(summary, 0, 300 * PRECISION, 300 * PRECISION, 100);
    });
```

- [ ] **Step 5: Run tests and confirm the utility tests fail**

Run:

```bash
rtk yarn workspace @budgie-at/bank-sync-tests test tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts
```

Expected: fails at least the stale signed balance test because current `buildDebtAccountProgressSummary` uses `balance` as outstanding even when ledger debit/credit entries exist.

---

### Task 2: Make Debt Summary Ledger-First

**Files:**
- Modify `packages/app/src/account/utils/build-debt-account-progress-summary.util.ts`

- [ ] **Step 1: Replace the current balance-first implementation**

Replace the function body with:

```ts
export const buildDebtAccountProgressSummary = ({
    balance,
    creditAmount,
    debitAmount,
    debtType,
    targetAmount
}: DebtAccountProgressSummaryParamsInterface) => {
    const closedAmount = debtType === AccountDebtTypeEnum.BORROW ? debitAmount : creditAmount;
    const openedAmount = debtType === AccountDebtTypeEnum.BORROW ? creditAmount : debitAmount;
    const signedOutstandingAmount = debtType === AccountDebtTypeEnum.BORROW ? -balance : balance;
    const balanceOutstandingAmount = Math.max(signedOutstandingAmount, 0);
    const hasLedgerActivity = isPositiveNumber(openedAmount) || isPositiveNumber(closedAmount);
    const ledgerOutstandingAmount = Math.max(openedAmount - closedAmount, 0);
    const outstandingAmount = hasLedgerActivity ? ledgerOutstandingAmount : Math.max(balanceOutstandingAmount, targetAmount, 0);
    const observedTotalAmount = hasLedgerActivity
        ? Math.max(openedAmount, closedAmount, closedAmount + outstandingAmount)
        : outstandingAmount;
    const totalAmount = Math.max(targetAmount, observedTotalAmount, 0);
    const paidAmount = Math.min(Math.max(totalAmount - outstandingAmount, 0), totalAmount);
    const percentage = isPositiveNumber(totalAmount) ? Math.min(Number(((paidAmount / totalAmount) * 100).toFixed(2)), 100) : 0;

    return {
        closedAmount,
        openedAmount,
        outstandingAmount,
        paidAmount,
        totalAmount,
        percentage
    };
};
```

- [ ] **Step 2: Run the debt scenario tests again**

Run:

```bash
rtk yarn workspace @budgie-at/bank-sync-tests test tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts
```

Expected: tests added in Task 1 pass unless repository fields from Task 3 are already referenced.

- [ ] **Step 3: Commit the utility and red/green tests**

Run:

```bash
rtk git add tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts packages/app/src/account/utils/build-debt-account-progress-summary.util.ts
rtk git commit -m "fix(app): derive debt progress from ledger activity"
```

Expected: commit succeeds.

---

### Task 3: Add Canonical Debt Summary SQL To The Repository

**Files:**
- Modify `packages/contracts/src/account-balance/repository/account-balance.repository.ts`
- Modify `tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts`

- [ ] **Step 1: Add repository-field tests**

Add this helper below `buildSummaryFromDebtAccount`:

```ts
const findHomeRow = (accountId: number, instrumentId: number) =>
    accountBalanceRepository
        .getHomeAccountRows(instrumentId)
        .all()
        .find(row => row.account.id === accountId);
```

Add this test after `summarizes lent debt after correcting returned amount and attaching income`:

```ts
    it('returns canonical debt progress fields from home account rows', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = await createDebtAccount(AccountDebtTypeEnum.LENT, 0, 15_000, cashAccount.instrumentId);

        await accountService.updateDebtById(debtAccount.id, {
            debtType: AccountDebtTypeEnum.LENT,
            currentBalance: 2_000,
            targetBalance: 15_000
        });

        const transaction = createIncomeTransaction(cashAccount.id, category.id, 109 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId: debtAccount.id });

        const row = findHomeRow(debtAccount.id, cashAccount.instrumentId);

        expect(row).toBeDefined();

        if (!isDefined(row)) {
            return;
        }

        expect(convertFromMicroUnits(row.convertedDebtOutstandingAmount)).toBe(12_891);
        expect(convertFromMicroUnits(row.convertedDebtPaidAmount)).toBe(2_109);
        expect(convertFromMicroUnits(row.convertedDebtTotalAmount)).toBe(15_000);
        expect(row.debtProgressPercentage).toBe(14.06);
    });
```

Add this test after the borrowed mirror integration test:

```ts
    it('uses canonical borrowed outstanding in remaining debt totals', async () => {
        const [category] = testDb.select().from(CategoryEntityTable).all();
        const cashAccount = seed.account({ title: 'Main account', type: AccountTypeEnum.BANK_SYNC });
        const debtAccount = await createDebtAccount(AccountDebtTypeEnum.BORROW, 15_000, 15_000, cashAccount.instrumentId);
        const repayment = createExpenseTransaction(cashAccount.id, category.id, 2_000 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: repayment.id, debtAccountId: debtAccount.id });

        const additionalBorrowing = createIncomeTransaction(cashAccount.id, category.id, 109 * PRECISION);

        await transactionDebtSettlementService.attach({ transactionId: additionalBorrowing.id, debtAccountId: debtAccount.id });

        const remainingBorrowedDebt = accountBalanceRepository
            .getTotalRemainingDebtByType(cashAccount.instrumentId, AccountDebtTypeEnum.BORROW)
            .get();

        expect(remainingBorrowedDebt?.total).toBe(13_109 * PRECISION);
    });
```

- [ ] **Step 2: Run tests and confirm compile failure on new fields**

Run:

```bash
rtk yarn workspace @budgie-at/bank-sync-tests test tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts
```

Expected: TypeScript/Vitest fails because `convertedDebtOutstandingAmount`, `convertedDebtPaidAmount`, `convertedDebtTotalAmount`, and `debtProgressPercentage` do not exist yet.

- [ ] **Step 3: Add debt summary SQL helpers**

In `AccountBalanceRepository`, add this private method below `getTransactionEntryAmountSumSql`:

```ts
    private getDebtProgressSql(balanceSql: SQL<number>, debitAmountSql: SQL<number>, creditAmountSql: SQL<number>, targetAmountSql: SQL<number>) {
        const openedAmountSql = sql<number>`
            CASE
                WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW}
                THEN ${creditAmountSql}
                ELSE ${debitAmountSql}
            END
        `;
        const closedAmountSql = sql<number>`
            CASE
                WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW}
                THEN ${debitAmountSql}
                ELSE ${creditAmountSql}
            END
        `;
        const signedOutstandingAmountSql = sql<number>`
            CASE
                WHEN ${AccountEntityTable.debtType} = ${AccountDebtTypeEnum.BORROW}
                THEN 0 - (${balanceSql})
                ELSE ${balanceSql}
            END
        `;
        const balanceOutstandingAmountSql = sql<number>`MAX(${signedOutstandingAmountSql}, 0)`;
        const hasLedgerActivitySql = sql`(${openedAmountSql} > 0 OR ${closedAmountSql} > 0)`;
        const ledgerOutstandingAmountSql = sql<number>`MAX(${openedAmountSql} - ${closedAmountSql}, 0)`;
        const outstandingAmountSql = sql<number>`
            CASE
                WHEN ${hasLedgerActivitySql}
                THEN ${ledgerOutstandingAmountSql}
                ELSE MAX(${balanceOutstandingAmountSql}, ${targetAmountSql}, 0)
            END
        `;
        const observedTotalAmountSql = sql<number>`
            CASE
                WHEN ${hasLedgerActivitySql}
                THEN MAX(${openedAmountSql}, ${closedAmountSql}, ${closedAmountSql} + ${outstandingAmountSql})
                ELSE ${outstandingAmountSql}
            END
        `;
        const totalAmountSql = sql<number>`MAX(${targetAmountSql}, ${observedTotalAmountSql}, 0)`;
        const paidAmountSql = sql<number>`MIN(MAX(${totalAmountSql} - ${outstandingAmountSql}, 0), ${totalAmountSql})`;
        const percentageSql = sql<number>`
            CASE
                WHEN ${totalAmountSql} > 0
                THEN MIN(ROUND((CAST(${paidAmountSql} AS REAL) / ${totalAmountSql}) * 10000) / 100, 100)
                ELSE 0
            END
        `;

        return {
            closedAmount: closedAmountSql.mapWith(Number),
            openedAmount: openedAmountSql.mapWith(Number),
            outstandingAmount: outstandingAmountSql.mapWith(Number),
            paidAmount: paidAmountSql.mapWith(Number),
            percentage: percentageSql.mapWith(Number),
            totalAmount: totalAmountSql.mapWith(Number)
        };
    }
```

- [ ] **Step 4: Expose summary fields in `getHomeAccountRows`**

Inside `getHomeAccountRows`, create raw debit/credit SQL once and use it for converted fields plus summary fields:

```ts
        const debitAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.DEBIT);
        const creditAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.CREDIT);
        const debtProgressSql = this.getDebtProgressSql(balanceSql, debitAmountSql, creditAmountSql, AccountEntityTable.targetBalance);
        const convertedDebitAmountSql = sql<number>`COALESCE((${debitAmountSql}) * ${exchangeRateSql}, 0)`;
        const convertedCreditAmountSql = sql<number>`COALESCE((${creditAmountSql}) * ${exchangeRateSql}, 0)`;
        const convertedTargetBalanceSql = sql<number>`COALESCE(${AccountEntityTable.targetBalance} * ${exchangeRateSql}, 0)`;
```

Add these fields to the select:

```ts
                convertedDebtClosedAmount: sql<number>`COALESCE(${debtProgressSql.closedAmount} * ${exchangeRateSql}, 0)`.mapWith(Number),
                convertedDebtOpenedAmount: sql<number>`COALESCE(${debtProgressSql.openedAmount} * ${exchangeRateSql}, 0)`.mapWith(Number),
                convertedDebtOutstandingAmount: sql<number>`COALESCE(${debtProgressSql.outstandingAmount} * ${exchangeRateSql}, 0)`.mapWith(Number),
                convertedDebtPaidAmount: sql<number>`COALESCE(${debtProgressSql.paidAmount} * ${exchangeRateSql}, 0)`.mapWith(Number),
                convertedDebtTotalAmount: sql<number>`COALESCE(${debtProgressSql.totalAmount} * ${exchangeRateSql}, 0)`.mapWith(Number),
                debtProgressPercentage: debtProgressSql.percentage,
```

- [ ] **Step 5: Update `getTotalRemainingDebtByType` to use the same SQL helper**

Replace the current signed-balance-only logic with:

```ts
        const exchangeRateSql = this.buildFiatExchangeRateConversionSql(defaultInstrumentId);
        const balanceSql = this.getAccountBalanceWithTransactionsSql();
        const debitAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.DEBIT);
        const creditAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.CREDIT);
        const debtProgressSql = this.getDebtProgressSql(balanceSql, debitAmountSql, creditAmountSql, AccountEntityTable.targetBalance);

        return this.db
            .select({ total: sql<number>`COALESCE(SUM((${debtProgressSql.outstandingAmount}) * ${exchangeRateSql}), 0)` })
            .from(AccountEntityTable)
            .where(
                this.getActiveAccountWhereSql(eq(AccountEntityTable.type, AccountTypeEnum.DEBT), eq(AccountEntityTable.debtType, debtType))
            );
```

- [ ] **Step 6: Add a per-account detail query**

Add this public method after `getByAccountId`:

```ts
    getDebtAccountProgressByAccountId(accountId: number) {
        const accountIdReference = sql`${accountId}`;
        const balanceSql = this.getAccountBalanceWithTransactionsSql(accountIdReference);
        const debitAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.DEBIT, accountIdReference);
        const creditAmountSql = this.getTransactionEntryAmountSumSql(TransactionEntryTypeEnum.CREDIT, accountIdReference);
        const debtProgressSql = this.getDebtProgressSql(balanceSql, debitAmountSql, creditAmountSql, AccountEntityTable.targetBalance);

        return this.db
            .select({
                closedAmount: debtProgressSql.closedAmount,
                creditAmount: creditAmountSql.mapWith(Number),
                debitAmount: debitAmountSql.mapWith(Number),
                openedAmount: debtProgressSql.openedAmount,
                outstandingAmount: debtProgressSql.outstandingAmount,
                paidAmount: debtProgressSql.paidAmount,
                percentage: debtProgressSql.percentage,
                totalAmount: debtProgressSql.totalAmount
            })
            .from(AccountEntityTable)
            .where(eq(AccountEntityTable.id, accountId))
            .limit(1);
    }
```

- [ ] **Step 7: Run repository tests**

Run:

```bash
rtk yarn workspace @budgie-at/bank-sync-tests test tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts
```

Expected: all debt scenario tests pass.

- [ ] **Step 8: Commit repository projection**

Run:

```bash
rtk git add packages/contracts/src/account-balance/repository/account-balance.repository.ts tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts
rtk git commit -m "fix(contracts): project debt progress from ledger totals"
```

Expected: commit succeeds.

---

### Task 4: Thread Canonical Summary Through Home And Details

**Files:**
- Create `packages/app/src/account/interface/debt-account-progress-summary.interface.ts`
- Create `packages/app/src/account/query/use-debt-account-progress-summary.query.ts`
- Modify `packages/app/src/account/interface/home-account-balance.interface.ts`
- Modify `packages/app/src/account/query/use-home-page-data.query.ts`
- Modify `packages/app/src/app/(main)/account/[id]/details.tsx`
- Delete `packages/app/src/account/query/use-debt-account-ledger-totals.query.ts`

- [ ] **Step 1: Add shared UI summary interface**

Create `packages/app/src/account/interface/debt-account-progress-summary.interface.ts`:

```ts
export interface DebtAccountProgressSummaryInterface {
    readonly closedAmount: number;
    readonly creditAmount: number;
    readonly debitAmount: number;
    readonly openedAmount: number;
    readonly outstandingAmount: number;
    readonly paidAmount: number;
    readonly percentage: number;
    readonly totalAmount: number;
}
```

- [ ] **Step 2: Add debt progress summary to home balance rows**

Add this import in `home-account-balance.interface.ts`:

```ts
import type { DebtAccountProgressSummaryInterface } from './debt-account-progress-summary.interface';
```

Add this field to `HomeAccountBalanceInterface`:

```ts
    readonly debtProgressSummary: DebtAccountProgressSummaryInterface;
```

- [ ] **Step 3: Map repository summary fields in `useHomePageDataQuery`**

Remove the `buildDebtAccountProgressSummary` import and replace `addDebtTypeTotal` with:

```ts
const addDebtTypeTotal = (totals: Map<AccountDebtTypeEnum, number>, homeAccountBalance: HomeAccountBalanceInterface): void => {
    const { accountType, debtProgressSummary, debtType, isActive } = homeAccountBalance;

    if (isActive && accountType === AccountTypeEnum.DEBT) {
        addTotal(totals, debtType, debtProgressSummary.outstandingAmount);
    }
};
```

In the `homeAccountBalance` object, add:

```ts
            debtProgressSummary: {
                closedAmount: convertFromMicroUnits(row.convertedDebtClosedAmount),
                creditAmount: convertFromMicroUnits(row.convertedCreditAmount),
                debitAmount: convertFromMicroUnits(row.convertedDebitAmount),
                openedAmount: convertFromMicroUnits(row.convertedDebtOpenedAmount),
                outstandingAmount: convertFromMicroUnits(row.convertedDebtOutstandingAmount),
                paidAmount: convertFromMicroUnits(row.convertedDebtPaidAmount),
                percentage: row.debtProgressPercentage,
                totalAmount: convertFromMicroUnits(row.convertedDebtTotalAmount)
            },
```

- [ ] **Step 4: Add detail summary query hook**

Create `packages/app/src/account/query/use-debt-account-progress-summary.query.ts`:

```ts
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

import type { DebtAccountProgressSummaryInterface } from '../interface/debt-account-progress-summary.interface';

const EMPTY_DEBT_PROGRESS_SUMMARY: DebtAccountProgressSummaryInterface = {
    closedAmount: 0,
    creditAmount: 0,
    debitAmount: 0,
    openedAmount: 0,
    outstandingAmount: 0,
    paidAmount: 0,
    percentage: 0,
    totalAmount: 0
};

export const useDebtAccountProgressSummaryQuery = (accountId: number): DebtAccountProgressSummaryInterface => {
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const { data } = useLiveQuery(accountBalanceRepository.getDebtAccountProgressByAccountId(accountId), [
        accountId,
        accountBalancesUpdatedAt
    ]);
    const row = data.at(0);
    const closedAmount = useCachedMicroUnitQuery(row?.closedAmount);
    const creditAmount = useCachedMicroUnitQuery(row?.creditAmount);
    const debitAmount = useCachedMicroUnitQuery(row?.debitAmount);
    const openedAmount = useCachedMicroUnitQuery(row?.openedAmount);
    const outstandingAmount = useCachedMicroUnitQuery(row?.outstandingAmount);
    const paidAmount = useCachedMicroUnitQuery(row?.paidAmount);
    const totalAmount = useCachedMicroUnitQuery(row?.totalAmount);

    if (!isDefined(row)) {
        return EMPTY_DEBT_PROGRESS_SUMMARY;
    }

    return {
        closedAmount,
        creditAmount,
        debitAmount,
        openedAmount,
        outstandingAmount,
        paidAmount,
        percentage: row.percentage,
        totalAmount
    };
};
```

- [ ] **Step 5: Update account details to use the detail summary hook**

In `details.tsx`, replace:

```ts
import { convertFromMicroUnits } from '../../../../@generic/utils/convert-from-micro-units.util';
import { useDebtAccountLedgerTotalsQuery } from '../../../../account/query/use-debt-account-ledger-totals.query';
```

with:

```ts
import { useDebtAccountProgressSummaryQuery } from '../../../../account/query/use-debt-account-progress-summary.query';
```

Replace:

```ts
    const { debitAmount, creditAmount } = useDebtAccountLedgerTotalsQuery(id);
```

with:

```ts
    const debtProgressSummary = useDebtAccountProgressSummaryQuery(id);
```

Replace the `DebtAccountBalance` props with:

```tsx
                        <DebtAccountBalance
                            debtType={debtType}
                            instrumentSymbol={instrument.symbol}
                            summary={debtProgressSummary}
                        />
```

- [ ] **Step 6: Remove the old ledger totals hook**

Delete `packages/app/src/account/query/use-debt-account-ledger-totals.query.ts`.

- [ ] **Step 7: Run TypeScript**

Run:

```bash
rtk yarn ts
```

Expected: fails only at components still expecting old `DebtAccountBalance` and `DebtAccountCard` props. Those are handled in Task 5.

---

### Task 5: Render Debt Summary Without Per-Card Queries

**Files:**
- Modify `packages/app/src/account/component/debt-account-balance/debt-account-balance.tsx`
- Create `packages/app/src/account/component/debt-account-balance/debt-account-balance.selector.ts`
- Modify `packages/app/src/account/component/account-grid-row/account-grid-row.tsx`
- Modify `packages/app/src/account/component/account-grid-item/account-grid-item.tsx`
- Modify `packages/app/src/account/component/account-card/account-card.tsx`
- Modify `packages/app/src/account/component/debt-account-card/debt-account-card.tsx`
- Modify `packages/app/src/account/component/debt-account-card-summary/debt-account-card-summary.tsx`
- Create `packages/app/src/account/component/debt-account-card-summary/debt-account-card-summary.selector.ts`

- [ ] **Step 1: Add detail selectors**

Create `packages/app/src/account/component/debt-account-balance/debt-account-balance.selector.ts`:

```ts
const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

const normalizeAmount = (amount: number) => normalizePart(String(amount));

export const DebtAccountBalanceSelector = {
    OutstandingAmount: (amount: number) => `DebtAccountBalance.OutstandingAmount.${normalizeAmount(amount)}` as const,
    PaidAmount: (amount: number) => `DebtAccountBalance.PaidAmount.${normalizeAmount(amount)}` as const,
    Percentage: (percentage: number) => `DebtAccountBalance.Percentage.${normalizeAmount(percentage)}` as const,
    TotalAmount: (amount: number) => `DebtAccountBalance.TotalAmount.${normalizeAmount(amount)}` as const
} as const;
```

- [ ] **Step 2: Update `DebtAccountBalance` props and selectors**

Replace the old props with:

```ts
interface Props {
    readonly debtType: AccountDebtTypeEnum;
    readonly instrumentSymbol: string;
    readonly summary: DebtAccountProgressSummaryInterface;
}
```

Remove the `buildDebtAccountProgressSummary` import and add:

```ts
import { DebtAccountBalanceSelector } from './debt-account-balance.selector';

import type { DebtAccountProgressSummaryInterface } from '../../interface/debt-account-progress-summary.interface';
```

Change the component signature to:

```ts
export const DebtAccountBalance = ({ debtType, instrumentSymbol, summary }: Props) => {
```

Add selector props:

```tsx
            <ProtectedMoney
                className="justify-start"
                minFontSize={10}
                maxFontSize={36}
                instrumentSymbol={instrumentSymbol}
                testID={DebtAccountBalanceSelector.OutstandingAmount(summary.outstandingAmount)}
            >
                {summary.outstandingAmount}
            </ProtectedMoney>
```

```tsx
                    <Text className={percentageTextVariants({ variant })} testID={DebtAccountBalanceSelector.Percentage(percentage)}>
                        {percentage}%
                    </Text>
```

```tsx
                    <Text className="text-secondary-foreground text-sm" testID={DebtAccountBalanceSelector.PaidAmount(summary.paidAmount)}>
                        {paidLabel}: {formattedPaidAmount}
                    </Text>
                    <Text className="text-secondary-foreground text-sm" testID={DebtAccountBalanceSelector.TotalAmount(summary.totalAmount)}>
                        {totalLabel}: {formattedTotalAmount}
                    </Text>
```

- [ ] **Step 3: Pass home balance rows into account grid items**

In `account-grid-row.tsx`, replace left/right balance extraction with:

```ts
    const leftBalanceRow = balancesByAccountId.get(row.left.id);
    const leftBalance = isDefined(leftBalanceRow) ? leftBalanceRow.balance : 0;
    const rightBalanceRow = isDefined(row.right) ? balancesByAccountId.get(row.right.id) : null;
    const rightBalance = isDefined(rightBalanceRow) ? rightBalanceRow.balance : 0;
```

Keep those constants and change item usage to:

```tsx
        <AccountGridItem
            account={row.right}
            balance={rightBalance}
            balanceRow={rightBalanceRow}
            type={accountType}
            isLeft={false}
        />
```

```tsx
            <AccountGridItem account={row.left} balance={leftBalance} balanceRow={leftBalanceRow} type={accountType} isLeft />
```

- [ ] **Step 4: Thread summary through `AccountGridItem` and `AccountCard`**

In `account-grid-item.tsx`, add to props:

```ts
    readonly balanceRow: HomeAccountBalanceInterface | null | undefined;
```

Add `balanceRow` to the component parameters and pass:

```tsx
                debtProgressSummary={balanceRow?.debtProgressSummary}
```

In `account-card.tsx`, import:

```ts
import type { DebtAccountProgressSummaryInterface } from '../../interface/debt-account-progress-summary.interface';
```

Add to props:

```ts
    readonly debtProgressSummary?: DebtAccountProgressSummaryInterface;
```

- [ ] **Step 5: Add home card selectors**

Create `packages/app/src/account/component/debt-account-card-summary/debt-account-card-summary.selector.ts`:

```ts
const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

const normalizeAmount = (amount: number) => normalizePart(String(amount));

export const DebtAccountCardSummarySelector = {
    OutstandingAmount: (title: string, amount: number) =>
        `DebtAccountCardSummary.OutstandingAmount.${normalizePart(title)}.${normalizeAmount(amount)}` as const,
    Percentage: (title: string, percentage: number) =>
        `DebtAccountCardSummary.Percentage.${normalizePart(title)}.${normalizeAmount(percentage)}` as const,
    TotalAmount: (title: string, amount: number) =>
        `DebtAccountCardSummary.TotalAmount.${normalizePart(title)}.${normalizeAmount(amount)}` as const
} as const;
```

- [ ] **Step 6: Update `DebtAccountCardSummary` for selectors**

Add `title` and `percentage` to props:

```ts
    readonly percentage: number;
    readonly title: string;
```

Import the selector:

```ts
import { DebtAccountCardSummarySelector } from './debt-account-card-summary.selector';
```

Set test IDs:

```tsx
            <ProtectedText
                className="text-primary font-medium"
                testID={DebtAccountCardSummarySelector.OutstandingAmount(title, currentBalance)}
            >
                {amountLeft}
            </ProtectedText>
```

```tsx
                <ProtectedText
                    className={textVariant({ variant: ACCOUNT_DEBT_TYPE_COLOR[debtType] })}
                    testID={DebtAccountCardSummarySelector.Percentage(title, percentage)}
                >
                    {instrumentSymbol}
                    {abbreviateNumber(currentBalance, 2)}
                </ProtectedText>
```

```tsx
                <ProtectedText
                    className="text-secondary-foreground text-xxs font-medium text-right"
                    testID={DebtAccountCardSummarySelector.TotalAmount(title, targetBalance)}
                >
                    {instrumentSymbol}
                    {abbreviateNumber(targetBalance, 2)}
                </ProtectedText>
```

- [ ] **Step 7: Remove card hook and render provided summary**

In `debt-account-card.tsx`, remove the per-card query import:

```ts
import { useDebtAccountLedgerTotalsQuery } from '../../query/use-debt-account-ledger-totals.query';
```

Keep the existing `buildDebtAccountProgressSummary` import and add:

```ts
import { buildDebtAccountProgressSummary } from '../../utils/build-debt-account-progress-summary.util';

import type { DebtAccountProgressSummaryInterface } from '../../interface/debt-account-progress-summary.interface';
```

Add to props:

```ts
    readonly debtProgressSummary?: DebtAccountProgressSummaryInterface;
```

Replace hook and summary creation with:

```ts
    const fallbackSummary = buildDebtAccountProgressSummary({
        balance,
        creditAmount: 0,
        debitAmount: 0,
        debtType,
        targetAmount: targetBalance
    });
    const summary = debtProgressSummary ?? fallbackSummary;
```

Pass title and percentage:

```tsx
        <DebtAccountCardSummary
            debtType={debtType}
            currentBalance={summary.outstandingAmount}
            targetBalance={summary.totalAmount}
            percentage={summary.percentage}
            title={title}
            instrumentSymbol={instrumentSymbol}
        />
```

- [ ] **Step 8: Run TypeScript and lint for component integration**

Run:

```bash
rtk yarn ts
rtk yarn lint
```

Expected: both commands pass.

- [ ] **Step 9: Commit app data-flow changes**

Run:

```bash
rtk git add packages/app/src/account/interface packages/app/src/account/query packages/app/src/app/'(main)'/account/'[id]'/details.tsx packages/app/src/account/component
rtk git commit -m "fix(app): render debt summaries from canonical ledger projection"
```

Expected: commit succeeds.

---

### Task 6: Fix Balance Adjustment Snapshot Ordering

**Files:**
- Modify `tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts`
- Modify `packages/app/src/account/service/account.service.ts`

- [ ] **Step 1: Add regression test for corrected debt balance after account update**

Add this test after `updates lent debt accounts by treating current balance as an already returned amount`:

```ts
    it('does not double count adjustment entries created while updating lent debt current balance', async () => {
        const account = await createDebtAccount(AccountDebtTypeEnum.LENT, 0, 15_000, 1);

        await accountService.updateDebtById(account.id, {
            debtType: AccountDebtTypeEnum.LENT,
            currentBalance: 2_000,
            targetBalance: 15_000
        });

        const balance = accountBalanceRepository.getByAccountId(account.id).get();
        const summary = buildSummaryFromDebtAccount(account, AccountDebtTypeEnum.LENT);

        expect(balance?.balance).toBe(13_000 * PRECISION);
        expectDebtProgressSummary(summary, 13_000 * PRECISION, 2_000 * PRECISION, 15_000 * PRECISION, 13.33);
    });
```

- [ ] **Step 2: Read current balance through the transaction and upsert the snapshot after the adjustment entry**

In `account.service.ts`, replace `adjustBalanceTo` with:

```ts
    private async adjustBalanceTo(accountId: number, targetBalance: number, tx: DB): Promise<void> {
        const result = await accountBalanceRepository.getByAccountId(accountId, tx);
        const currentBalanceMicro = result.at(0)?.balance ?? 0;
        const targetBalanceMicro = convertToMicroUnits(targetBalance);
        const delta = targetBalanceMicro - currentBalanceMicro;

        if (delta === 0) {
            return;
        }

        const isIncome = isPositiveNumber(delta);
        const absDelta = Math.abs(delta);

        const transaction = await transactionRepository.create(
            {
                type: TransactionTypeEnum.ADJUSTMENT,
                title: '',
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt: new Date(),
                exchangeRate: 1,
                fromAccountId: isIncome ? null : accountId,
                toAccountId: isIncome ? accountId : null,
                updatedBy: null
            },
            tx
        );

        await transactionEntryRepository.create(
            {
                accountId,
                transactionId: transaction.id,
                categoryId: null,
                mccCategoryId: null,
                amount: absDelta,
                type: isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT
            },
            tx
        );

        await accountBalanceRepository.upsert({ accountId, amount: targetBalanceMicro, updatedAt: new Date() }, tx);
    }
```

Update `AccountBalanceRepository.getByAccountId` to accept an optional transaction:

```ts
    getByAccountId(accountId: number, tx?: DB) {
        return (tx ?? this.db)
            .select({ balance: this.getAccountBalanceWithTransactionsSql(sql`${accountId}`) })
            .from(AccountEntityTable)
            .where(eq(AccountEntityTable.id, accountId))
            .limit(1);
    }
```

- [ ] **Step 3: Run debt scenario tests**

Run:

```bash
rtk yarn workspace @budgie-at/bank-sync-tests test tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts
```

Expected: all tests pass.

- [ ] **Step 4: Commit adjustment fix**

Run:

```bash
rtk git add packages/app/src/account/service/account.service.ts packages/contracts/src/account-balance/repository/account-balance.repository.ts tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts
rtk git commit -m "fix(app): stabilize debt balance adjustments"
```

Expected: commit succeeds.

---

### Task 7: Add Exact Maestro Debt Flows

**Files:**
- Modify `tests/app-tests/flows/subflows/accounts/create-debt-account.flow.yaml`
- Modify `tests/app-tests/flows/03.account-debt-lent.flow.yaml`
- Modify `tests/app-tests/flows/04.account-debt-borrowed.flow.yaml`
- Modify `tests/app-tests/flows/31.debt-settlement-attachments.flow.yaml`

- [ ] **Step 1: Add `CURRENT_BALANCE` to debt creation subflow**

In `create-debt-account.flow.yaml`, after waiting for `AccountForm.NameInput`, insert:

```yaml
- tapOn:
    id: 'CreateAccount.Amount'
- inputText: ${CURRENT_BALANCE}
- tapOn:
    text: 'Debt Account'
```

- [ ] **Step 2: Update existing debt account flows to pass current balance**

In `03.account-debt-lent.flow.yaml`, add:

```yaml
      CURRENT_BALANCE: '0'
```

In `04.account-debt-borrowed.flow.yaml`, add:

```yaml
      CURRENT_BALANCE: '0'
```

- [ ] **Step 3: Replace the debt attachment flow with exact lent, borrowed, and completed assertions**

In `31.debt-settlement-attachments.flow.yaml`, set the first debt account env to:

```yaml
      ACCOUNT_NAME: 'E2E Lent Debt'
      CURRENCY_CODE: 'EUR'
      CURRENT_BALANCE: '2000'
      DEBT_TYPE: 'LENT'
      TARGET_BALANCE: '15000'
```

Change the first income amount to `109`, attach it to `E2E Lent Debt`, and after opening account details assert:

```yaml
- assertVisible:
    id: 'DebtAccountBalance.OutstandingAmount.12891'
- assertVisible:
    id: 'DebtAccountBalance.PaidAmount.2109'
- assertVisible:
    id: 'DebtAccountBalance.TotalAmount.15000'
- assertVisible:
    id: 'DebtAccountBalance.Percentage.14_06'
- assertVisible:
    id: 'TransactionCard.Label.E2E_Debt_Attach_Income'
```

After returning home assert the tile:

```yaml
- assertVisible:
    id: 'DebtAccountCardSummary.OutstandingAmount.E2E_Lent_Debt.12891'
- assertVisible:
    id: 'DebtAccountCardSummary.TotalAmount.E2E_Lent_Debt.15000'
```

Append a borrowed section:

```yaml
- runFlow:
    file: subflows/accounts/create-debt-account.flow.yaml
    env:
      ACCOUNT_NAME: 'E2E Borrowed Debt'
      CURRENCY_CODE: 'EUR'
      CURRENT_BALANCE: '15000'
      DEBT_TYPE: 'BORROW'
      TARGET_BALANCE: '15000'
```

Create an expense of `2000`, attach it to `E2E Borrowed Debt`, create an income of `109`, attach it to the same debt, then open details and assert:

```yaml
- assertVisible:
    id: 'DebtAccountBalance.OutstandingAmount.13109'
- assertVisible:
    id: 'DebtAccountBalance.PaidAmount.1891'
- assertVisible:
    id: 'DebtAccountBalance.TotalAmount.15000'
- assertVisible:
    id: 'DebtAccountBalance.Percentage.12_61'
```

Append a completed lent section:

```yaml
- runFlow:
    file: subflows/accounts/create-debt-account.flow.yaml
    env:
      ACCOUNT_NAME: 'E2E Completed Debt'
      CURRENCY_CODE: 'EUR'
      CURRENT_BALANCE: '0'
      DEBT_TYPE: 'LENT'
      TARGET_BALANCE: '300'
```

Create an income of `300`, attach it to `E2E Completed Debt`, then open details and assert:

```yaml
- assertVisible:
    id: 'DebtAccountBalance.OutstandingAmount.0'
- assertVisible:
    id: 'DebtAccountBalance.PaidAmount.300'
- assertVisible:
    id: 'DebtAccountBalance.TotalAmount.300'
- assertVisible:
    id: 'DebtAccountBalance.Percentage.100'
```

- [ ] **Step 4: Run the single Maestro flow on a booted iOS simulator**

Run:

```bash
rtk yarn workspace @budgie-at/app-tests test:ios tests/app-tests/flows/31.debt-settlement-attachments.flow.yaml
```

Expected: flow passes and exact debt summary selectors are visible.

- [ ] **Step 5: Commit E2E coverage**

Run:

```bash
rtk git add tests/app-tests/flows/subflows/accounts/create-debt-account.flow.yaml tests/app-tests/flows/03.account-debt-lent.flow.yaml tests/app-tests/flows/04.account-debt-borrowed.flow.yaml tests/app-tests/flows/31.debt-settlement-attachments.flow.yaml
rtk git commit -m "test(app): cover debt repayment progress flows"
```

Expected: commit succeeds.

---

### Task 8: Query Plan Check And Final Validation

**Files:**
- Modify `packages/app/drizzle/0034_add_debt_ledger_summary_index.sql` only if the explain plan scans `transaction_entries` for debt summary aggregation.
- Modify `packages/contracts/src/transaction-entry/table/transaction-entry-entity.table.ts` only if a new index is added.

- [ ] **Step 1: Check query plan for the debt summary query**

Run this from the app test database context by using the bank-sync test harness after Task 3 is implemented:

```bash
rtk yarn workspace @budgie-at/bank-sync-tests test tests/bank-sync-tests/src/scenarios/debt/debt-settlement-statistics.test.ts
```

Expected: no performance failure. If local inspection is needed, add a temporary `EXPLAIN QUERY PLAN` call in the test, read the output, then remove it before commit.

- [ ] **Step 2: Add an index only if explain shows a transaction entry scan for debt totals**

If needed, create `packages/app/drizzle/0034_add_debt_ledger_summary_index.sql`:

```sql
CREATE INDEX `transaction_entries_live_account_type_kind_idx`
ON `transaction_entries` (`account_id`, `type`, `kind`)
WHERE `deleted_at` IS NULL AND `original_transaction_id` IS NULL;
```

Add the matching schema index in `transaction-entry-entity.table.ts`:

```ts
        index('transaction_entries_live_account_type_kind_idx')
            .on(table.accountId, table.type, table.kind)
            .where(sql`${table.deletedAt} IS NULL AND ${table.originalTransactionId} IS NULL`),
```

Run:

```bash
rtk yarn ts
```

Expected: TypeScript passes. If explain does not show a scan, do not add these files.

- [ ] **Step 3: Run full validation**

Run:

```bash
rtk yarn format
rtk yarn ts
rtk yarn lint
rtk yarn deadcode
rtk yarn cpd
```

Expected: all commands pass. `rtk yarn format` may modify files; commit formatting changes if it does.

- [ ] **Step 4: Confirm no old ledger hook imports remain**

Run:

```bash
rtk rg "useDebtAccountLedgerTotalsQuery|use-debt-account-ledger-totals" packages tests
```

Expected: no matches.

- [ ] **Step 5: Push branch**

Run:

```bash
rtk git status -sb
rtk git push
```

Expected: branch pushes to `origin/codex/debt-settlement-attachments`.

---

## Self-Review

Spec coverage:
- Lent income payback reducing outstanding is covered by Task 1 and Task 7.
- Lent expense increasing outstanding is preserved by existing tests and the ledger direction formula in Task 2.
- Borrowed expense repayment and borrowed income additional borrowing are covered by Task 1 and Task 7.
- Initial principal/endgame from `targetBalance` is preserved in Task 2 and tested through current target-only tests.
- Home cards, detail headers, and debt section totals consume the same summary through Tasks 3, 4, and 5.
- Completed debt state is covered by Task 1 and Task 7.
- Query shape avoids React N+1 debt card reads in Tasks 4 and 5.
- Index decision is gated by query plan evidence in Task 8.

Placeholder scan:
- The plan contains exact files, exact code blocks, exact commands, and expected results.
- The optional index path is conditional on measured query plan evidence and includes exact SQL and schema code.

Type consistency:
- `DebtAccountProgressSummaryInterface` fields match repository select fields, home mapping fields, detail hook return fields, and component props.
- Maestro selectors normalize decimal percentages, so `14.06` becomes `14_06` consistently.
