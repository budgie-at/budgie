import {
    accountBalanceRepository,
    budgetRepository,
    statisticsRepository,
    transactionCategorizeInboxRepository,
    transactionRepository
} from '@app/@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { CategorizeInboxLabelKindEnum } from '@app/categorize-inbox/enum/categorize-inbox-label-kind.enum';
import { categorizeInboxService } from '@app/categorize-inbox/service/categorize-inbox.service';
import {
    AccountTypeEnum,
    CASH_WITHDRAWAL_TRACKED_CATEGORY_ID,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    RUNWAY_WINDOW_MONTHS
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { findMccByCode, run, seed, seedBankPair } from '../../harness';

const PRECISION = 1_000_000;
const ATM_AMOUNT = 500 * PRECISION;
const GROCERY_AMOUNT = 40 * PRECISION;
const INSTRUMENT_ID = 1;

const buildLastMonthDate = (): Date => {
    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth() - 1, 15, 12);
};

const snapshotSpending = async (accountIds: number[]) => {
    const operatedAt = buildLastMonthDate();
    const periodStart = new Date(operatedAt.getFullYear(), operatedAt.getMonth(), 1);
    const nextPeriodStart = new Date(operatedAt.getFullYear(), operatedAt.getMonth() + 1, 1);
    const [totals] = statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, INSTRUMENT_ID).all();
    const runway = statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, INSTRUMENT_ID, RUNWAY_WINDOW_MONTHS).all();
    const budgetSpent = await budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, INSTRUMENT_ID);
    const categoryRows = statisticsRepository.getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, INSTRUMENT_ID, LanguageEnum.EN).all();
    const [uncategorizedCount] = await transactionRepository.countUncategorized(DEFAULT_TRANSACTION_FILTER);
    const ledger = await run(accountBalanceRepository.getLedgerBalances(accountIds));

    return {
        expense: totals.expense,
        income: totals.income,
        runwayExpense: runway.reduce((total, row) => total + row.expense, 0),
        budgetSpent: budgetSpent.reduce((total, row) => total + row.amount, 0),
        categoryIds: categoryRows.map(row => row.category?.id ?? null),
        uncategorizedExpenseCount: uncategorizedCount.expense,
        ledger: accountIds.map(accountId => ledger.get(accountId) ?? 0),
        stored: accountIds.map(accountId => accountBalanceRepository.getByAccountId(accountId).get()?.balance ?? 0)
    };
};

describe('consolidation/atm-already-tracked', () => {
    it('keeps an already tracked ATM withdrawal on the bank ledger and out of spending, and undo restores it', async () => {
        const bankAccount = seed.account({ externalId: 'mono-bank', type: AccountTypeEnum.BANK_SYNC, instrumentId: INSTRUMENT_ID });
        const cashAccount = seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: INSTRUMENT_ID });
        const atmExpense = seedBankPair.expense(
            { externalId: 'tx-atm-tracked', operatedAt: buildLastMonthDate() },
            { accountId: bankAccount.id, amount: ATM_AMOUNT, mccCategoryId: findMccByCode('6011').id }
        );
        seedBankPair.expense(
            { externalId: 'tx-groceries', operatedAt: buildLastMonthDate() },
            { accountId: bankAccount.id, amount: GROCERY_AMOUNT, mccCategoryId: findMccByCode('5411').id }
        );
        const accountIds = [bankAccount.id, cashAccount.id];
        await run(accountBalanceIncrementalService.updateAllBalances(true));
        const before = await snapshotSpending(accountIds);
        const atmRows = (await transactionCategorizeInboxRepository.findUncategorizedRows(DEFAULT_TRANSACTION_FILTER)).filter(
            row => row.transactionId === atmExpense.id
        );
        const assignment = {
            key: 'atm',
            displayTitle: 'ATM',
            rows: atmRows,
            ruleConditionValue: '',
            labelId: CASH_WITHDRAWAL_TRACKED_CATEGORY_ID
        };

        expect(atmRows).toHaveLength(1);
        expect(await run(categorizeInboxService.assign(CategorizeInboxLabelKindEnum.CATEGORY, [assignment]))).toHaveLength(1);

        const after = await snapshotSpending(accountIds);

        expect(after.ledger).toEqual(before.ledger);
        expect(after.stored).toEqual(after.ledger);
        expect(after.ledger).toEqual([-(ATM_AMOUNT + GROCERY_AMOUNT), 0]);
        expect(after.income).toBe(before.income);
        expect(before.expense - after.expense).toBe(ATM_AMOUNT);
        expect(before.runwayExpense - after.runwayExpense).toBe(ATM_AMOUNT);
        expect(before.budgetSpent - after.budgetSpent).toBe(ATM_AMOUNT);
        expect(after.categoryIds).not.toContain(CASH_WITHDRAWAL_TRACKED_CATEGORY_ID);
        expect(before.uncategorizedExpenseCount - after.uncategorizedExpenseCount).toBe(1);
        expect(
            (await transactionCategorizeInboxRepository.findUncategorizedRows(DEFAULT_TRANSACTION_FILTER)).map(row => row.transactionId)
        ).not.toContain(atmExpense.id);

        await run(categorizeInboxService.undo(CategorizeInboxLabelKindEnum.CATEGORY, [assignment]));

        expect(await snapshotSpending(accountIds)).toEqual(before);
    });
});
