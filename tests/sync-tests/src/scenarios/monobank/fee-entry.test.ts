import {
    AccountBalanceRepository,
    BANK_FEE_CATEGORY_ID,
    CategoryEntityTable,
    CategoryRepository,
    CategorySourceEnum,
    DEFAULT_TRANSACTION_FILTER,
    LanguageEnum,
    PRECISION,
    StatisticsRepository,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, MonobankSyncService, setupMonobankFixture, testDb, TestLayer } from '../../harness';

describe('monobank/fee-entry', () => {
    it.effect('finds the bank fee default category by lowercase localized search', () =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            yield* setupMonobankFixture();

            const categories = yield* categoryRepository.findBySearchQuery('бан', true, LanguageEnum.UK);

            expect(categories.some(category => category.id === BANK_FEE_CATEGORY_ID)).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('creates a dedicated balance-impacting fee entry without category split semantics', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const statisticsRepository = yield* StatisticsRepository;
            const { account } = yield* setupMonobankFixture();
            monobankStub.statement([buildMonobank.transaction({ id: 'tx-fee', amount: -6000, hold: false, commissionRate: -1000 })]);

            yield* monobankSyncService.sync();

            const [mainEntry] = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-fee'));
            const [feeEntry] = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-fee:fee'));

            const [feeCategory] = yield* testDb.select().from(CategoryEntityTable).where(eq(CategoryEntityTable.id, BANK_FEE_CATEGORY_ID));
            const categoryEntries = [mainEntry, feeEntry].filter(entry => entry.type !== TransactionEntryTypeEnum.FEE);

            expect(mainEntry.amount).toBe(50 * PRECISION);
            expect(categoryEntries).toHaveLength(1);
            expect(feeEntry.amount).toBe(10 * PRECISION);
            expect(feeEntry.type).toBe(TransactionEntryTypeEnum.FEE);
            expect(feeEntry.categoryId).toBe(BANK_FEE_CATEGORY_ID);
            expect(feeEntry.categorySource).toBe(CategorySourceEnum.FEE);
            expect(feeCategory.title).toBe('Bank Fees & Charges');

            const balance = (yield* accountBalanceRepository.getByAccountId(account.id)).at(0);
            const totals = (yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, account.instrumentId)).at(
                0
            );
            const categoryRows = yield* statisticsRepository.getExpenseByCategoryQuery(
                DEFAULT_TRANSACTION_FILTER,
                account.instrumentId,
                LanguageEnum.EN
            );
            const feeCategoryAmount = categoryRows.find(row => row.category?.id === BANK_FEE_CATEGORY_ID)?.amount;

            expect(balance?.balance).toBe(-60 * PRECISION);
            expect(totals?.expense).toBe(60 * PRECISION);
            expect(feeCategoryAmount).toBe(10 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps a single entry when there is no commission', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            yield* setupMonobankFixture();
            monobankStub.statement([buildMonobank.transaction({ id: 'tx-no-fee', amount: -6000, hold: false, commissionRate: 0 })]);

            yield* monobankSyncService.sync();

            const entries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.externalId, 'tx-no-fee:fee'));

            expect(entries).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
