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
import { EntryBaseValuationService } from '@budgie/market';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { requireInstrument, seedBitcoinCryptoAccount, seedEuroBaseUahAccount, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

const HISTORICAL_ANALYTICS_EXPENSE_AMOUNT = 5_419_222;

const setDefaultInstrument = (defaultInstrumentId: number) =>
    Effect.gen(function* () {
        yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId });
    });

const expectSeededUahValuation = Effect.fnUntraced(function* (operatedAt: Date) {
    const entryBaseValuationService = yield* EntryBaseValuationService;
    const { euro, account } = yield* seedEuroBaseUahAccount();

    const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({ accountId: account.id, amount: 50 * PRECISION, operatedAt });

    expect(valuation).toStrictEqual({
        baseInstrumentId: euro.id,
        baseExchangeRate: 0.0889028367561666,
        baseAmount: 4_445_142
    });
});

const dbCategories = () =>
    Effect.gen(function* () {
        return yield* testDb.select().from(CategoryEntityTable);
    });

const createHistoricalExpense = Effect.fnUntraced(function* (accountId: number, categoryId: number, operatedAt: Date) {
    const entryBaseValuationService = yield* EntryBaseValuationService;
    const transaction = yield* insertOne(TransactionEntityTable, {
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
        operatedAt
    });

    yield* insertOne(TransactionEntryEntityTable, {
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
    it.effect('values a back-dated UAH entry with the seeded historical NBU rate, not the current one', () =>
        expectSeededUahValuation(new Date('2011-05-25T12:00:00.000Z')).pipe(Effect.provide(TestLayer))
    );

    it.effect('values a transaction older than the seeded range using the oldest available historical rate', () =>
        expectSeededUahValuation(new Date('2009-01-01T12:00:00.000Z')).pipe(Effect.provide(TestLayer))
    );

    it.effect('allows manual crypto entries to remain unvalued when no live crypto rate exists', () =>
        Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const { account } = yield* seedBitcoinCryptoAccount();

            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: account.id,
                amount: 100 * PRECISION,
                operatedAt: new Date('2026-06-04T15:35:37.321Z')
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
            const [category] = yield* dbCategories();
            const account = yield* seed.account({ instrumentId: hryvnia.id });

            yield* setDefaultInstrument(euro.id);
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
