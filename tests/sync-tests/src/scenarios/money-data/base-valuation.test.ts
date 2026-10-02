import { EntryBaseValuationService } from '@app/money-data/service/entry-base-valuation.service';
import {
    CategoryEntityTable,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    LanguageEnum,
    PRECISION,
    SettingsEntityTable,
    StatisticsRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { requireInstrument, seedBitcoinCryptoAccount, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

const HISTORICAL_ANALYTICS_EXPENSE_AMOUNT = 5_419_222;

const setDefaultInstrument = (defaultInstrumentId: number): void => {
    testDb.update(SettingsEntityTable).set({ defaultInstrumentId }).run();
};

const expectHistoricalUahValuation = Effect.fnUntraced(function* (externalSource: ExternalSourceEnum | null) {
    const entryBaseValuationService = yield* EntryBaseValuationService;
    const euro = yield* requireInstrument(CurrencyEnum.EUR);
    const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
    const account = seed.account({ instrumentId: hryvnia.id });

    setDefaultInstrument(euro.id);

    const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
        accountId: account.id,
        amount: 50 * PRECISION,
        operatedAt: new Date('2011-05-25T12:00:00.000Z'),
        externalSource
    });

    expect(valuation).toStrictEqual({
        baseInstrumentId: euro.id,
        baseExchangeRate: 0.0889028367561666,
        baseAmount: 4_445_142
    });
});

const dbCategories = () => testDb.select().from(CategoryEntityTable).all();

const createHistoricalExpense = Effect.fnUntraced(function* (accountId: number, categoryId: number, operatedAt: Date) {
    const entryBaseValuationService = yield* EntryBaseValuationService;
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: 'Historical UAH expense',
        operatedAt,
        comment: '',
        toAccountId: null,
        fromAccountId: accountId,
        exchangeRate: 1,
        externalId: null,
        externalSource: ExternalSourceEnum.CSV,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);
    const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
        accountId,
        amount: 50 * PRECISION,
        operatedAt,
        externalSource: ExternalSourceEnum.CSV
    });

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: 50 * PRECISION,
        categoryId,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: valuation.baseInstrumentId,
        baseExchangeRate: valuation.baseExchangeRate,
        baseAmount: valuation.baseAmount,
        toIban: null
    } satisfies TransactionEntryCreateEntityInterface);
});

describe('base valuation', () => {
    it.effect('values imported UAH entries with seeded historical NBU rates', () =>
        Effect.gen(function* () {
            yield* expectHistoricalUahValuation(ExternalSourceEnum.CSV);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('values a manually back-dated UAH entry with the historical rate, not the current one', () =>
        Effect.gen(function* () {
            yield* expectHistoricalUahValuation(null);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('allows manual crypto entries to remain unvalued when no live crypto rate exists', () =>
        Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const { account } = yield* seedBitcoinCryptoAccount();

            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: account.id,
                amount: 100 * PRECISION,
                operatedAt: new Date('2026-06-04T15:35:37.321Z'),
                externalSource: null
            });

            expect(valuation).toStrictEqual({
                baseInstrumentId: null,
                baseExchangeRate: null,
                baseAmount: null
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('sums analytics with historical base amounts from different periods', () =>
        Effect.gen(function* () {
            const statisticsRepository = yield* StatisticsRepository;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
            const [category] = dbCategories();
            const account = seed.account({ instrumentId: hryvnia.id });

            setDefaultInstrument(euro.id);
            yield* createHistoricalExpense(account.id, category.id, new Date('2011-05-25T12:00:00.000Z'));
            yield* createHistoricalExpense(account.id, category.id, new Date('2026-05-25T12:00:00.000Z'));

            const [totals] = yield* statisticsRepository.getTotalIncomeAndExpenseQuery(DEFAULT_TRANSACTION_FILTER, euro.id);
            const [categoryTotal] = yield* statisticsRepository.getExpenseByCategoryQuery(
                DEFAULT_TRANSACTION_FILTER,
                euro.id,
                LanguageEnum.EN
            );

            expect(totals?.expense).toBe(HISTORICAL_ANALYTICS_EXPENSE_AMOUNT);
            expect(totals?.income).toBe(0);
            expect(categoryTotal.amount).toBe(HISTORICAL_ANALYTICS_EXPENSE_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );
});
