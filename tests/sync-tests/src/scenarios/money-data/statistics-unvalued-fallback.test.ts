import { MoneyDataUpgradeService } from '@app/money-data/service/money-data-upgrade.service';
import {
    AccountTypeEnum,
    CategoryEntityTable,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExchangeRateEntityTable,
    LanguageEnum,
    PRECISION,
    SettingsEntityTable,
    StatisticsRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { requireInstrument, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

const UNCONVERTIBLE_EXPENSE_AMOUNT = Number('15000') * PRECISION;

const seedUnconvertibleExpense = Effect.fnUntraced(function* (title: string) {
    const euro = yield* requireInstrument(CurrencyEnum.EUR);
    const foreignInstrument = seed.instrument({
        code: 'NOFX',
        name: 'No Rate Currency',
        symbol: 'NF'
    });
    const account = seed.account({ instrumentId: foreignInstrument.id, type: AccountTypeEnum.BANK });
    const [category] = testDb.select().from(CategoryEntityTable).all();

    testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id }).run();

    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title,
        operatedAt: new Date('2026-05-15T12:00:00.000Z'),
        comment: '',
        fromAccountId: account.id,
        toAccountId: null,
        exchangeRate: 1,
        externalId: null,
        externalSource: null,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

    const entry = insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId: account.id,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: UNCONVERTIBLE_EXPENSE_AMOUNT,
        categoryId: category.id,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: null,
        baseExchangeRate: null,
        baseAmount: null,
        toIban: null
    } satisfies TransactionEntryCreateEntityInterface);

    return { category, entry, euro, transaction };
});

const getExpenseCategoryAmount = Effect.fnUntraced(function* (categoryId: number, baseInstrumentId: number) {
    const statisticsRepository = yield* StatisticsRepository;
    const categoryRows = yield* statisticsRepository.getExpenseByCategoryQuery(
        DEFAULT_TRANSACTION_FILTER,
        baseInstrumentId,
        LanguageEnum.EN
    );

    return categoryRows.find(row => row.category?.id === categoryId)?.amount ?? 0;
});

describe('statistics fallback for unvalued entries', () => {
    it.effect('includes an unvalued foreign income entry via live conversion instead of dropping it', () =>
        Effect.gen(function* () {
            const statisticsRepository = yield* StatisticsRepository;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
            const account = seed.account({ instrumentId: hryvnia.id, type: AccountTypeEnum.BANK });

            testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id }).run();
            insertOne(ExchangeRateEntityTable, { source: 'test', baseInstrumentId: hryvnia.id, quoteInstrumentId: euro.id, rate: 0.02 });

            const transaction = insertOne(TransactionEntityTable, {
                type: TransactionTypeEnum.INCOME,
                title: 'Unvalued UAH income',
                operatedAt: new Date('2026-05-15T12:00:00.000Z'),
                comment: '',
                fromAccountId: null,
                toAccountId: account.id,
                exchangeRate: 1,
                externalId: null,
                externalSource: null,
                updatedBy: null
            } satisfies TransactionCreateEntityInterface);

            insertOne(TransactionEntryEntityTable, {
                transactionId: transaction.id,
                accountId: account.id,
                type: TransactionEntryTypeEnum.DEBIT,
                amount: 1000 * PRECISION,
                categoryId: null,
                mccCategoryId: null,
                externalId: null,
                exchangeRate: 1,
                baseInstrumentId: null,
                baseExchangeRate: null,
                baseAmount: null,
                toIban: null
            } satisfies TransactionEntryCreateEntityInterface);

            const totals = (yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, euro.id)).at(0);

            expect(totals?.income).toBe(20 * PRECISION);
            expect(totals?.expense).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not treat unconvertible foreign expenses as default-currency amounts', () =>
        Effect.gen(function* () {
            const statisticsRepository = yield* StatisticsRepository;
            const { category, euro, transaction } = yield* seedUnconvertibleExpense('Unconvertible foreign expense');
            const tag = seed.tag('Car');

            seed.transactionTag(transaction.id, tag.id);

            const totals = (yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, euro.id)).at(0);
            const tagRows = yield* statisticsRepository.getExpenseByTagQuery(DEFAULT_TRANSACTION_FILTER, euro.id);
            const categoryAmount = yield* getExpenseCategoryAmount(category.id, euro.id);
            const tagAmount = tagRows.find(row => row.tag?.id === tag.id)?.amount ?? 0;

            expect([totals?.expense, categoryAmount, tagAmount]).toStrictEqual([0, 0, 0]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('completes historical valuation while preserving unconvertible entries as unvalued', () =>
        Effect.gen(function* () {
            const statisticsRepository = yield* StatisticsRepository;
            const transactionEntryRepository = yield* TransactionEntryRepository;
            const moneyDataUpgradeService = yield* MoneyDataUpgradeService;
            const { category, entry, euro } = yield* seedUnconvertibleExpense('Unconvertible upgrade expense');

            expect(yield* transactionEntryRepository.countPendingBaseValuationEntries(euro.id)).toBe(1);

            yield* moneyDataUpgradeService.run();

            const [updatedEntry] = testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.id, entry.id))
                .all();
            const totals = (yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, euro.id)).at(0);
            const categoryAmount = yield* getExpenseCategoryAmount(category.id, euro.id);

            expect(updatedEntry.baseInstrumentId).toBe(euro.id);
            expect(updatedEntry.baseExchangeRate).toBeNull();
            expect(updatedEntry.baseAmount).toBeNull();
            expect(yield* transactionEntryRepository.countPendingBaseValuationEntries(euro.id)).toBe(0);
            expect(totals?.expense).toBe(0);
            expect(categoryAmount).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
