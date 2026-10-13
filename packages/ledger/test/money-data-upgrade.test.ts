import { assertStoredBalancesMatchLedger } from '@budgie-at/test-kit';
import {
    Db,
    HistoricalExchangeRateEntityTable,
    PRECISION,
    SettingsEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';

import { MoneyDataUpgradeService } from '../src/money-data/service/money-data-upgrade.service';

import { seed, TestLayer } from './ledger-test-layer';

import type { MoneyDataUpgradeRuntimeSnapshotInterface } from '../src/money-data/interface/money-data-upgrade-runtime-snapshot.interface';

const MoneyDataUpgradeTestLayer = MoneyDataUpgradeService.layer.pipe(Layer.provideMerge(TestLayer));

const ENTRY_AMOUNT = 1000 * PRECISION;

const MISSING_BASE_INSTRUMENT = 'Base instrument not found';

const seedPendingExpenses = Effect.fn(function* () {
    const database = yield* Db;
    const testSeedService = yield* seed;
    const base = yield* testSeedService.instrument({ code: 'TMA', name: 'Money base', symbol: 'MA' });
    const quote = yield* testSeedService.instrument({ code: 'TMB', name: 'Money quote', symbol: 'MB' });
    const account = yield* testSeedService.account({ instrumentId: quote.id });

    yield* database.update(SettingsEntityTable).set({ defaultInstrumentId: base.id });
    yield* database
        .insert(HistoricalExchangeRateEntityTable)
        .values({ sourceInstrumentId: quote.id, targetInstrumentId: base.id, rateDate: '2025-01-01', rate: 0.5 });

    const transactions = yield* database
        .insert(TransactionEntityTable)
        .values(
            ['2025-01-02T12:00:00.000Z', '2025-01-03T12:00:00.000Z'].map(operatedAt => ({
                type: TransactionTypeEnum.EXPENSE,
                title: 'Pending valuation',
                operatedAt: new Date(operatedAt),
                comment: '',
                fromAccountId: account.id,
                toAccountId: null,
                exchangeRate: 1,
                externalId: null,
                externalSource: null,
                updatedBy: null
            }))
        )
        .returning();

    yield* database.insert(TransactionEntryEntityTable).values(
        transactions.map(transaction => ({
            transactionId: transaction.id,
            accountId: account.id,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: ENTRY_AMOUNT,
            categoryId: null,
            mccCategoryId: null,
            externalId: null,
            exchangeRate: 1,
            baseInstrumentId: null,
            baseExchangeRate: null,
            baseAmount: null,
            toIban: null
        }))
    );

    return { account, base };
});

const idleSnapshot = (
    counts: Pick<MoneyDataUpgradeRuntimeSnapshotInterface, 'pendingEntryCount' | 'processedEntryCount' | 'totalEntryCount'>
) => ({
    isRunning: false,
    isUpdatingBalances: false,
    lastError: null,
    ...counts
});

describe('money data upgrade', () => {
    it.live('values pending entries with historical rates, reports progress per bucket and rebuilds balances', () =>
        Effect.gen(function* () {
            const moneyDataUpgradeService = yield* MoneyDataUpgradeService;
            const database = yield* Db;
            const { account, base } = yield* seedPendingExpenses();

            expect(yield* moneyDataUpgradeService.refreshSnapshot(MISSING_BASE_INSTRUMENT)).toStrictEqual(
                idleSnapshot({ pendingEntryCount: 2, processedEntryCount: 0, totalEntryCount: 2 })
            );

            const collector = yield* Effect.forkChild(
                Stream.runCollect(
                    Stream.takeUntil(moneyDataUpgradeService.changes, snapshot => !snapshot.isRunning && snapshot.processedEntryCount === 2)
                ),
                { startImmediately: true }
            );

            yield* Effect.yieldNow;

            const result = yield* moneyDataUpgradeService.run(MISSING_BASE_INSTRUMENT);
            const snapshots = yield* Fiber.join(collector);

            expect(snapshots).toStrictEqual([
                idleSnapshot({ pendingEntryCount: 2, processedEntryCount: 0, totalEntryCount: 2 }),
                { ...idleSnapshot({ pendingEntryCount: 0, processedEntryCount: 0, totalEntryCount: 0 }), isRunning: true },
                { ...idleSnapshot({ pendingEntryCount: 2, processedEntryCount: 0, totalEntryCount: 2 }), isRunning: true },
                { ...idleSnapshot({ pendingEntryCount: 1, processedEntryCount: 1, totalEntryCount: 2 }), isRunning: true },
                { ...idleSnapshot({ pendingEntryCount: 0, processedEntryCount: 2, totalEntryCount: 2 }), isRunning: true },
                {
                    ...idleSnapshot({ pendingEntryCount: 0, processedEntryCount: 2, totalEntryCount: 2 }),
                    isRunning: true,
                    isUpdatingBalances: true
                },
                idleSnapshot({ pendingEntryCount: 0, processedEntryCount: 2, totalEntryCount: 2 })
            ]);
            expect(result).toStrictEqual(idleSnapshot({ pendingEntryCount: 0, processedEntryCount: 2, totalEntryCount: 2 }));

            const entries = (yield* database.select().from(TransactionEntryEntityTable)).filter(entry => entry.accountId === account.id);

            expect(
                entries.map(({ baseInstrumentId, baseExchangeRate, baseAmount }) => ({ baseInstrumentId, baseExchangeRate, baseAmount }))
            ).toStrictEqual([
                { baseInstrumentId: base.id, baseExchangeRate: 0.5, baseAmount: ENTRY_AMOUNT / 2 },
                { baseInstrumentId: base.id, baseExchangeRate: 0.5, baseAmount: ENTRY_AMOUNT / 2 }
            ]);
            expect(yield* moneyDataUpgradeService.refreshSnapshot(MISSING_BASE_INSTRUMENT)).toStrictEqual(
                idleSnapshot({ pendingEntryCount: 0, processedEntryCount: 0, totalEntryCount: 0 })
            );
            yield* assertStoredBalancesMatchLedger(database);
        }).pipe(Effect.provide(MoneyDataUpgradeTestLayer))
    );

    it.live('picks the historical rate of the entry calendar day in a negative UTC offset', () =>
        Effect.gen(function* () {
            const moneyDataUpgradeService = yield* MoneyDataUpgradeService;
            const database = yield* Db;
            const { account, base } = yield* seedPendingExpenses();
            const quoteInstrumentId = account.instrumentId;

            yield* database.insert(HistoricalExchangeRateEntityTable).values([
                { sourceInstrumentId: quoteInstrumentId, targetInstrumentId: base.id, rateDate: '2025-01-02', rate: 0.4 },
                { sourceInstrumentId: quoteInstrumentId, targetInstrumentId: base.id, rateDate: '2025-01-03', rate: 0.25 }
            ]);

            yield* moneyDataUpgradeService.run(MISSING_BASE_INSTRUMENT);

            const entries = (yield* database.select().from(TransactionEntryEntityTable)).filter(entry => entry.accountId === account.id);

            expect(entries.map(entry => entry.baseExchangeRate)).toStrictEqual([0.4, 0.25]);
        }).pipe(Effect.provide(MoneyDataUpgradeTestLayer))
    );

    it.live('reports a missing base instrument without touching entries', () =>
        Effect.gen(function* () {
            const moneyDataUpgradeService = yield* MoneyDataUpgradeService;
            const database = yield* Db;
            yield* database.update(SettingsEntityTable).set({ defaultInstrumentId: null });
            yield* Db.query(db => db.$client.unsafe(`UPDATE instruments SET code = 'XUSD' WHERE code = 'USD'`));

            expect(yield* moneyDataUpgradeService.refreshSnapshot(MISSING_BASE_INSTRUMENT)).toStrictEqual({
                ...idleSnapshot({ pendingEntryCount: 0, processedEntryCount: 0, totalEntryCount: 0 }),
                lastError: MISSING_BASE_INSTRUMENT
            });

            const exit = yield* Effect.exit(moneyDataUpgradeService.run(MISSING_BASE_INSTRUMENT));

            expect(Exit.isFailure(exit)).toBe(true);
            expect(yield* Stream.runCollect(Stream.take(moneyDataUpgradeService.changes, 1))).toStrictEqual([
                {
                    ...idleSnapshot({ pendingEntryCount: 0, processedEntryCount: 0, totalEntryCount: 0 }),
                    lastError: MISSING_BASE_INSTRUMENT
                }
            ]);
        }).pipe(Effect.provide(MoneyDataUpgradeTestLayer))
    );
});
