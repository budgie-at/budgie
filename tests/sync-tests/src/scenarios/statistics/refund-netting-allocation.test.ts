import {
    CategoryEntityTable,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    PRECISION,
    StatisticsRepository,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchExpenseEntries, seed, TestLayer, testDb } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { seedRefundedExpense } from '../../harness/seed/seed-refund-fixture';

const CENT = PRECISION / 100;
const SEPTEMBER = { from: new Date(2026, 8, 1), to: new Date(2026, 8, 30, 23, 59, 59) };
const OCTOBER = { from: new Date(2026, 9, 1), to: new Date(2026, 9, 31, 23, 59, 59) };
const REFUND_DELAY_SECONDS = 20 * 86_400;

const insertCategory = (title: string) =>
    insertOne(CategoryEntityTable, { title, titleSearch: title.toLowerCase(), icon: UserIconNameEnum.House, parentId: null });

const seedSplitRefundedPurchase = Effect.fnUntraced(function* (splitAmounts: readonly [number, number], refundAmount: number) {
    const transferConsolidationService = yield* TransferConsolidationService;
    const account = yield* seed.account({ externalId: `split-refund-${splitAmounts.join('-')}` });
    const first = yield* insertCategory(`Split first ${splitAmounts[0]}`);
    const second = yield* insertCategory(`Split second ${splitAmounts[1]}`);
    const { expense } = yield* seedRefundedExpense({
        accountId: account.id,
        expenseAmount: splitAmounts[0] + splitAmounts[1],
        refundAmounts: [refundAmount],
        expenseOperatedAt: new Date(2026, 8, 15, 12),
        refundDelaySeconds: REFUND_DELAY_SECONDS,
        externalIdPrefix: `split-${splitAmounts.join('-')}`
    });

    yield* transferConsolidationService.consolidate(null);

    const [credit] = (yield* fetchExpenseEntries(expense.id)).filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT);

    yield* testDb
        .update(TransactionEntryEntityTable)
        .set({ amount: splitAmounts[0], baseAmount: splitAmounts[0], categoryId: first.id })
        .where(eq(TransactionEntryEntityTable.id, credit.id));
    yield* insertOne(TransactionEntryEntityTable, {
        transactionId: expense.id,
        accountId: account.id,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: splitAmounts[1],
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: credit.baseInstrumentId,
        baseExchangeRate: 1,
        baseAmount: splitAmounts[1],
        toIban: null,
        categoryId: second.id,
        mccCategoryId: null,
        originalTransactionId: null
    });

    return { account, first, second };
});

describe('statistics refund netting allocation', () => {
    it.effect('allocates a refund across split entries in cents so the netted total never exceeds what was spent', () =>
        Effect.gen(function* () {
            const statisticsRepository = yield* StatisticsRepository;
            const { account, first, second } = yield* seedSplitRefundedPurchase([CENT, CENT], CENT);
            const filters = { ...DEFAULT_TRANSACTION_FILTER, date: SEPTEMBER };
            const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(filters, account.instrumentId);
            const ranking = yield* statisticsRepository.getExpenseByCategoryQuery(filters, account.instrumentId, LanguageEnum.EN);
            const amountOf = (categoryId: number) => ranking.find(row => row.category?.id === categoryId)?.amount ?? 0;

            expect(totals.expense).toBe(CENT);
            expect(amountOf(first.id) + amountOf(second.id)).toBe(CENT);
            expect(ranking.reduce((sum, row) => sum + row.amount, 0)).toBe(totals.expense);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reports only the selected category share of a refund netted against a split purchase', () =>
        Effect.gen(function* () {
            const statisticsRepository = yield* StatisticsRepository;
            const { account, first, second } = yield* seedSplitRefundedPurchase([60 * PRECISION, 40 * PRECISION], 60 * PRECISION);
            const captionOf = (categoryId: number, date: typeof OCTOBER) =>
                Effect.map(
                    statisticsRepository.getNettedRefundsQuery(
                        { ...DEFAULT_TRANSACTION_FILTER, categoryIds: [categoryId], date },
                        account.instrumentId
                    ),
                    ([row]) => row.amount
                );
            const ranking = yield* statisticsRepository.getExpenseByCategoryQuery(
                { ...DEFAULT_TRANSACTION_FILTER, date: SEPTEMBER },
                account.instrumentId,
                LanguageEnum.EN
            );
            const netOf = (categoryId: number) => ranking.find(row => row.category?.id === categoryId)?.amount;

            expect([netOf(first.id), netOf(second.id)]).toStrictEqual([24 * PRECISION, 16 * PRECISION]);
            expect(yield* captionOf(first.id, OCTOBER)).toBe(36 * PRECISION);
            expect(yield* captionOf(second.id, OCTOBER)).toBe(24 * PRECISION);
            expect(yield* captionOf(first.id, SEPTEMBER)).toBe(60 * PRECISION - 24 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});
