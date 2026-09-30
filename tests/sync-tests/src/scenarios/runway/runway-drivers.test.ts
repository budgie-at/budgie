import { aggregateRunwayDrivers } from '@app/runway/utils/aggregate-runway-drivers.util';
import { median } from '@app/runway/utils/median.util';
import {
    CategoryEntityTable,
    UserIconNameEnum,
    CurrencyEnum,
    DEFAULT_TRANSACTION_FILTER,
    ExternalSourceEnum,
    LanguageEnum,
    PRECISION,
    RUNWAY_WINDOW_MONTHS,
    RunwayDriverDimensionEnum,
    StatisticsRepository,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { explainQueryPlan, requireInstrument, testDb, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { seed } from '../../harness/seed/seed';

import type { RunwayDriverBreakdownInterface } from '@app/runway/interface/runway-driver-breakdown.interface';
import type { TransactionCreateEntityInterface, TransactionEntryCreateEntityInterface } from '@budgie/contracts';

const REGULAR_MONTHLY_AMOUNT = 100 * PRECISION;
const ONE_OFF_AMOUNT = 60 * PRECISION;
const FIRST_TAIL_AMOUNT = PRECISION;
const SECOND_TAIL_AMOUNT = PRECISION / 2;
const UNTAGGED_AMOUNT = 40 * PRECISION;
const SEEDED_MONTHS = 4;

const seedCategory = (title: string): { readonly id: number; readonly title: string } =>
    insertOne(CategoryEntityTable, { title, titleSearch: title.toLowerCase(), icon: UserIconNameEnum.Wallet, parentId: null });

const monthOperatedAt = (monthsAgo: number): Date => {
    const now = new Date();

    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 15, 12));
};

const seedExpense = (accountId: number, categoryId: number, amount: number, monthsAgo: number): number => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title: `Runway driver expense ${categoryId} ${monthsAgo}`,
        operatedAt: monthOperatedAt(monthsAgo),
        comment: '',
        toAccountId: null,
        fromAccountId: accountId,
        exchangeRate: 1,
        externalId: null,
        externalSource: ExternalSourceEnum.CSV,
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount,
        categoryId,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: null,
        baseExchangeRate: null,
        baseAmount: null,
        toIban: null
    } satisfies TransactionEntryCreateEntityInterface);

    return transaction.id;
};

const seedScenario = Effect.fnUntraced(function* () {
    const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);

    return { instrumentId: hryvnia.id, accountId: seed.account({ instrumentId: hryvnia.id }).id };
});

const aggregate = Effect.fnUntraced(function* (dimension: RunwayDriverDimensionEnum, instrumentId: number) {
    const statisticsRepository = yield* StatisticsRepository;
    const seriesRows = yield* statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, RUNWAY_WINDOW_MONTHS);
    const monthlyBurn = median(seriesRows.map(row => row.expense));
    const driverRows = yield* statisticsRepository.getRunwayDriverSeriesQuery(
        DEFAULT_TRANSACTION_FILTER,
        instrumentId,
        dimension,
        RUNWAY_WINDOW_MONTHS,
        LanguageEnum.EN
    );
    const categoryRows = yield* statisticsRepository.getRunwayDriverSeriesQuery(
        DEFAULT_TRANSACTION_FILTER,
        instrumentId,
        RunwayDriverDimensionEnum.CATEGORY,
        RUNWAY_WINDOW_MONTHS,
        LanguageEnum.EN
    );

    return {
        drivers: aggregateRunwayDrivers(driverRows, monthlyBurn).drivers,
        irregularMonthlyAmount: aggregateRunwayDrivers(categoryRows, monthlyBurn).irregularMonthlyAmount
    } satisfies RunwayDriverBreakdownInterface;
});

describe('runway drivers', () => {
    it.effect('divides by months with data, flags only one-offs and folds the long tail', () =>
        Effect.gen(function* () {
            const { instrumentId, accountId } = yield* seedScenario();
            const regular = seedCategory('Groceries');
            const oneOff = seedCategory('Dentist');
            const firstTail = seedCategory('Stamps');
            const secondTail = seedCategory('Candles');

            Array.from({ length: SEEDED_MONTHS }, (_, index) => index + 1).forEach(monthsAgo => {
                seedExpense(accountId, regular.id, REGULAR_MONTHLY_AMOUNT, monthsAgo);
            });
            seedExpense(accountId, oneOff.id, ONE_OFF_AMOUNT, 2);
            seedExpense(accountId, firstTail.id, FIRST_TAIL_AMOUNT, 3);
            seedExpense(accountId, secondTail.id, SECOND_TAIL_AMOUNT, 1);

            const { drivers, irregularMonthlyAmount } = yield* aggregate(RunwayDriverDimensionEnum.CATEGORY, instrumentId);

            expect(drivers).toStrictEqual([
                { id: regular.id, title: regular.title, monthlyAmount: REGULAR_MONTHLY_AMOUNT, isIrregular: false, foldedDriverCount: 0 },
                {
                    id: oneOff.id,
                    title: oneOff.title,
                    monthlyAmount: ONE_OFF_AMOUNT / SEEDED_MONTHS,
                    isIrregular: true,
                    foldedDriverCount: 0
                },
                {
                    id: null,
                    title: '',
                    monthlyAmount: (FIRST_TAIL_AMOUNT + SECOND_TAIL_AMOUNT) / SEEDED_MONTHS,
                    isIrregular: false,
                    foldedDriverCount: 2
                }
            ]);
            expect(irregularMonthlyAmount).toBe((ONE_OFF_AMOUNT + FIRST_TAIL_AMOUNT + SECOND_TAIL_AMOUNT) / SEEDED_MONTHS);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('counts secondary tags and untagged spend in the tag dimension without changing irregular spend', () =>
        Effect.gen(function* () {
            const { instrumentId, accountId } = yield* seedScenario();
            const regular = seedCategory('Groceries');
            const oneOff = seedCategory('Dentist');
            const tag = seed.tag('Trip');
            const secondTag = seed.tag('Health');

            Array.from({ length: SEEDED_MONTHS }, (_, index) => index + 1).forEach(monthsAgo => {
                const transactionId = seedExpense(accountId, regular.id, REGULAR_MONTHLY_AMOUNT, monthsAgo);

                seed.transactionTag(transactionId, tag.id);
            });
            seedExpense(accountId, regular.id, UNTAGGED_AMOUNT, 1);
            const oneOffTransactionId = seedExpense(accountId, oneOff.id, ONE_OFF_AMOUNT, 2);

            seed.transactionTag(oneOffTransactionId, tag.id);
            seed.transactionTag(oneOffTransactionId, secondTag.id);

            const tagBreakdown = yield* aggregate(RunwayDriverDimensionEnum.TAG, instrumentId);

            expect(tagBreakdown.drivers).toStrictEqual([
                {
                    id: tag.id,
                    title: 'Trip',
                    monthlyAmount: (REGULAR_MONTHLY_AMOUNT * SEEDED_MONTHS + ONE_OFF_AMOUNT) / SEEDED_MONTHS,
                    isIrregular: false,
                    foldedDriverCount: 0
                },
                {
                    id: secondTag.id,
                    title: 'Health',
                    monthlyAmount: ONE_OFF_AMOUNT / SEEDED_MONTHS,
                    isIrregular: true,
                    foldedDriverCount: 0
                },
                { id: null, title: '', monthlyAmount: UNTAGGED_AMOUNT / SEEDED_MONTHS, isIrregular: true, foldedDriverCount: 0 }
            ]);
            expect(tagBreakdown.irregularMonthlyAmount).toBe(ONE_OFF_AMOUNT / SEEDED_MONTHS);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('runway month window predicate', () => {
    it.effect('selects the same transactions as the previous strftime-based window and uses the visible/operated index', () =>
        Effect.gen(function* () {
            const { instrumentId, accountId } = yield* seedScenario();
            const category = seedCategory('Groceries');

            Array.from({ length: RUNWAY_WINDOW_MONTHS + 2 }, (_, index) => index).forEach(monthsAgo => {
                seedExpense(accountId, category.id, REGULAR_MONTHLY_AMOUNT, monthsAgo);
            });
            testDb.run(sql`ANALYZE`);

            const monthsAgoOffset = `-${RUNWAY_WINDOW_MONTHS} months`;

            const oldPredicateIds = testDb
                .all<{ id: number }>(
                    sql`SELECT id FROM transactions
                 WHERE strftime('%Y-%m', operated_at, 'unixepoch') >= strftime('%Y-%m', 'now', ${monthsAgoOffset})
                   AND strftime('%Y-%m', operated_at, 'unixepoch') < strftime('%Y-%m', 'now')
                 ORDER BY id`
                )
                .map(row => row.id);

            const newPredicateIds = testDb
                .all<{ id: number }>(
                    sql`SELECT id FROM transactions
                 WHERE operated_at >= unixepoch(strftime('%Y-%m-01', 'now', ${monthsAgoOffset}))
                   AND operated_at < unixepoch(strftime('%Y-%m-01', 'now'))
                 ORDER BY id`
                )
                .map(row => row.id);

            expect(newPredicateIds.length).toBeGreaterThan(0);
            expect(newPredicateIds).toStrictEqual(oldPredicateIds);

            const statisticsRepository = yield* StatisticsRepository;
            const seriesPlan = yield* explainQueryPlan(
                statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, instrumentId, RUNWAY_WINDOW_MONTHS)
            );

            expect(seriesPlan.some(detail => detail.includes('transactions_visible_operated_idx'))).toBe(true);
            expect(seriesPlan.some(detail => detail.includes('SCAN transactions '))).toBe(false);

            const driverPlan = yield* explainQueryPlan(
                statisticsRepository.getRunwayDriverSeriesQuery(
                    DEFAULT_TRANSACTION_FILTER,
                    instrumentId,
                    RunwayDriverDimensionEnum.CATEGORY,
                    RUNWAY_WINDOW_MONTHS,
                    LanguageEnum.EN
                )
            );

            expect(driverPlan.some(detail => detail.includes('transactions_visible_operated_idx'))).toBe(true);
            expect(driverPlan.some(detail => detail.includes('SCAN transactions '))).toBe(false);
        }).pipe(Effect.provide(TestLayer))
    );
});
