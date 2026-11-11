import { BudgetProjectionService } from '@app/budget/service/budget-projection.service';
import { fromBudgetProjectionKey } from '@app/budget/utils/from-budget-projection-key.util';
import { RECURRING_READ_TABLES } from '@app/recurring/constant/recurring-read-tables.constant';
import { makeTestDatabase } from '@budgie-at/test-kit';
import {
    BudgetKindEnum,
    BudgetLimitSourceEnum,
    BudgetPeriodEnum,
    CurrencyEnum,
    Db,
    PERSONAL_SYNC_ZONE,
    PRECISION,
    RecurringCadenceUnitEnum,
    RecurringSeriesKindEnum,
    SettingsEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import * as schema from '@budgie/contracts/schema';
import { RecurringService } from '@budgie/recurring';
import { describe, expect, it } from '@effect/vitest';
import { getTableName } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { requireInstrument, seed, testDb, TestLayer } from '../../harness';

const NOW = new Date(2026, 5, 15, 12);
const SEEDED_MONTHS = [3, 2, 1] as const;

const readTableNames = (statements: readonly string[]) =>
    Object.values(schema)
        .map(table => getTableName(table))
        .filter(tableName => statements.some(statement => new RegExp(`\\b(?:from|join)\\s+"?${tableName}\\b`, 'iu').test(statement)));

const seedFixture = Effect.gen(function* () {
    const usd = yield* requireInstrument(CurrencyEnum.USD);
    const eur = yield* requireInstrument(CurrencyEnum.EUR);
    const account = yield* seed.account({ instrumentId: usd.id });
    const category = yield* seed.category('Subscriptions');
    const recurringService = yield* RecurringService;

    yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: usd.id });
    const transactions = yield* Effect.forEach(SEEDED_MONTHS, monthsAgo =>
        seed.manualExpense({
            accountId: account.id,
            amount: 12 * PRECISION,
            categoryId: category.id,
            operatedAt: new Date(2026, 5 - monthsAgo, 5, 12),
            title: 'NETFLIX'
        })
    );
    yield* Effect.forEach(SEEDED_MONTHS, monthsAgo =>
        seed.manualExpense({
            accountId: account.id,
            amount: 3000 * PRECISION,
            operatedAt: new Date(2026, 5 - monthsAgo, 1, 12),
            title: 'ACME SALARY',
            type: TransactionTypeEnum.INCOME
        })
    );
    const expenseSeries = yield* recurringService.createManual({
        kind: RecurringSeriesKindEnum.EXPENSE,
        title: 'NETFLIX',
        amount: 12 * PRECISION,
        instrumentId: usd.id,
        cadenceUnit: RecurringCadenceUnitEnum.MONTH,
        cadenceInterval: 1,
        anchorDate: new Date(2026, 2, 5),
        categoryId: category.id,
        accountId: account.id
    });
    yield* recurringService.createManual({
        kind: RecurringSeriesKindEnum.INCOME,
        title: 'ACME SALARY',
        amount: 3000 * PRECISION,
        instrumentId: usd.id,
        cadenceUnit: RecurringCadenceUnitEnum.MONTH,
        cadenceInterval: 1,
        anchorDate: new Date(2026, 2, 1)
    });

    return { eurId: eur.id, seriesId: expenseSeries.id, transactionId: transactions[0].id };
});

const readAsConsumers = (fixture: Effect.Success<typeof seedFixture>) =>
    Effect.gen(function* () {
        const recurringService = yield* RecurringService;
        const budgetProjectionService = yield* BudgetProjectionService;
        const budget = fromBudgetProjectionKey({
            id: 1,
            kind: BudgetKindEnum.MAIN,
            period: BudgetPeriodEnum.MONTHLY,
            periodStartDay: 1,
            useLastDayOfMonth: false,
            limitSource: BudgetLimitSourceEnum.INCOME_EXPECTED,
            instrumentId: fixture.eurId,
            overallLimit: 0,
            otherLimit: 0,
            tagId: null,
            syncZone: PERSONAL_SYNC_ZONE,
            periodAnchorMs: null,
            startsAtMs: null,
            endsAtMs: null,
            dayStart: NOW.getTime()
        });

        yield* recurringService.listSeries(NOW);
        yield* recurringService.calendar(NOW.getFullYear(), NOW.getMonth(), NOW);
        yield* recurringService.getSeriesDetail(fixture.seriesId, NOW);
        yield* recurringService.seriesForTransaction(fixture.transactionId);
        yield* recurringService.fittingSeries(fixture.transactionId, NOW);
        yield* budgetProjectionService.expectedIncome(budget, NOW);
    });

describe('recurring/read-tables', () => {
    it.effect('lists every table the recurring reads touch', () =>
        Effect.gen(function* () {
            const fixture = yield* seedFixture;
            const statements: string[] = [];
            const observedDb = yield* makeTestDatabase(testDb.$client, statement => statements.push(statement));

            yield* readAsConsumers(fixture).pipe(Effect.provideService(Db, observedDb));

            const readNames = readTableNames(statements);
            const listedTableNames = new Set<string>(RECURRING_READ_TABLES.map(table => getTableName(table)));

            expect(readNames).not.toHaveLength(0);
            expect(readNames.filter(tableName => !listedTableNames.has(tableName))).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});
