import { AccountBalanceIncrementalService } from '@app/account/service/account-balance-incremental.service';
import { BudgetRepository } from '@budgie/budget';
import { CategorizeInboxLabelKindEnum, CategorizeInboxService, TransactionCategorizeInboxRepository } from '@budgie/categorization';
import {
    AccountBalanceRepository,
    AccountTypeEnum,
    CASH_WITHDRAWAL_TRACKED_CATEGORY_ID,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    RUNWAY_WINDOW_MONTHS,
    StatisticsRepository,
    TransactionViewRepository
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { findMccByCode, seed, seedBankPair, TestLayer } from '../../harness';

const PRECISION = 1_000_000;
const ATM_AMOUNT = 500 * PRECISION;
const GROCERY_AMOUNT = 40 * PRECISION;
const INSTRUMENT_ID = 1;

const buildLastMonthDate = (): Date => {
    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth() - 1, 15, 12);
};

const snapshotSpending = Effect.fnUntraced(function* (accountIds: number[]) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const budgetRepository = yield* BudgetRepository;
    const statisticsRepository = yield* StatisticsRepository;
    const transactionViewRepository = yield* TransactionViewRepository;
    const operatedAt = buildLastMonthDate();
    const periodStart = new Date(operatedAt.getFullYear(), operatedAt.getMonth(), 1);
    const nextPeriodStart = new Date(operatedAt.getFullYear(), operatedAt.getMonth() + 1, 1);
    const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, INSTRUMENT_ID);
    const runway = yield* statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, INSTRUMENT_ID, RUNWAY_WINDOW_MONTHS);
    const budgetSpent = yield* budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, INSTRUMENT_ID);
    const categoryRows = yield* statisticsRepository.getExpenseByCategoryQuery(DEFAULT_TRANSACTION_FILTER, INSTRUMENT_ID, LanguageEnum.EN);
    const [uncategorizedCount] = yield* transactionViewRepository.countUncategorized(DEFAULT_TRANSACTION_FILTER);
    const ledger = yield* accountBalanceRepository.getLedgerBalances(accountIds);

    const stored = yield* Effect.forEach(accountIds, accountId => accountBalanceRepository.getByAccountId(accountId));

    return {
        expense: totals.expense,
        income: totals.income,
        runwayExpense: runway.reduce((total, row) => total + row.expense, 0),
        budgetSpent: budgetSpent.reduce((total, row) => total + row.amount, 0),
        categoryIds: categoryRows.map(row => row.category?.id ?? null),
        uncategorizedExpenseCount: uncategorizedCount.expense,
        ledger: accountIds.map(accountId => ledger.get(accountId) ?? 0),
        stored: stored.map(balances => balances.at(0)?.balance ?? 0)
    };
});

describe('consolidation/atm-already-tracked', () => {
    it.effect('keeps an already tracked ATM withdrawal on the bank ledger and out of spending, and undo restores it', () =>
        Effect.gen(function* () {
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const categorizeInboxService = yield* CategorizeInboxService;
            const transactionCategorizeInboxRepository = yield* TransactionCategorizeInboxRepository;
            const bankAccount = yield* seed.account({
                externalId: 'mono-bank',
                type: AccountTypeEnum.BANK_SYNC,
                instrumentId: INSTRUMENT_ID
            });
            const cashAccount = yield* seed.account({ title: 'Cash', type: AccountTypeEnum.CASH, instrumentId: INSTRUMENT_ID });
            const atmExpense = yield* seedBankPair.expense(
                { externalId: 'tx-atm-tracked', operatedAt: buildLastMonthDate() },
                { accountId: bankAccount.id, amount: ATM_AMOUNT, mccCategoryId: (yield* findMccByCode('6011')).id }
            );
            yield* seedBankPair.expense(
                { externalId: 'tx-groceries', operatedAt: buildLastMonthDate() },
                { accountId: bankAccount.id, amount: GROCERY_AMOUNT, mccCategoryId: (yield* findMccByCode('5411')).id }
            );
            const accountIds = [bankAccount.id, cashAccount.id];
            yield* accountBalanceIncrementalService.updateAllBalances(true);
            const before = yield* snapshotSpending(accountIds);
            const atmRows = (yield* transactionCategorizeInboxRepository.findUncategorizedRows(DEFAULT_TRANSACTION_FILTER)).filter(
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
            expect(yield* categorizeInboxService.assign(CategorizeInboxLabelKindEnum.CATEGORY, [assignment])).toHaveLength(1);

            const after = yield* snapshotSpending(accountIds);

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
                (yield* transactionCategorizeInboxRepository.findUncategorizedRows(DEFAULT_TRANSACTION_FILTER)).map(
                    row => row.transactionId
                )
            ).not.toContain(atmExpense.id);

            yield* categorizeInboxService.undo(CategorizeInboxLabelKindEnum.CATEGORY, [assignment]);

            expect(yield* snapshotSpending(accountIds)).toEqual(before);
        }).pipe(Effect.provide(TestLayer))
    );
});
