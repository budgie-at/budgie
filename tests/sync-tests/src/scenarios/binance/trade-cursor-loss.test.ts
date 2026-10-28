import { SyncEntityTable, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    fetchSortedBinanceExternalIds,
    fetchSyncById,
    jumpPastDeadline,
    restoreRealTimers,
    RUN_DEADLINE_MS,
    setupStaleForwardFixture,
    STALE_SYNC_AGE_MS,
    testDb,
    TestLayer
} from '../../harness';

const FUTURE_TRADE_OFFSET_MS = 30 * 1000;
const SERVER_AHEAD_MS = 2 * 60 * 1000;
const FIRST_TRADE_ID = 10;
const SECOND_TRADE_ID = 11;

const firstTradeExternalId = `binance:trade:ADAUSDT:${FIRST_TRADE_ID}`;
const secondTradeExternalId = `binance:trade:ADAUSDT:${SECOND_TRADE_ID}`;

const buildAdaTrade = (id: number, time: number) => buildBinance.fill('ADAUSDT', id, { qty: '10', quoteQty: '5', time });

const makeSyncDueAgain = (syncId: number) =>
    testDb
        .update(SyncEntityTable)
        .set({
            enabled: true,
            status: SyncStatusEnum.SYNCING,
            errorCount: 0,
            forwardSyncedAt: new Date(Date.now() - STALE_SYNC_AGE_MS)
        })
        .where(eq(SyncEntityTable.id, syncId));

const readStoredCursor = (syncId: number) => Effect.map(fetchSyncById(syncId), sync => sync.binanceTradeCursor);

describe('binance/trade-cursor-loss', () => {
    it.effect('imports the trades of a symbol fetched before a deadline deferral on the next run', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { sync } = yield* setupStaleForwardFixture(['ADA', 'BNB']);

            binanceStub.myTrades({ ADAUSDT: [buildAdaTrade(FIRST_TRADE_ID, Date.now())] }, new Set<string>(), [], {
                onServed: jumpPastDeadline
            });

            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS).pipe(Effect.ensuring(restoreRealTimers));

            expect(yield* fetchBinanceTransactions()).toHaveLength(0);
            expect(yield* readStoredCursor(sync.id)).toBeNull();

            binanceStub.myTrades({ ADAUSDT: [buildAdaTrade(FIRST_TRADE_ID, Date.now())] });
            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([firstTradeExternalId]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('imports a trade that landed after the run started on the next run', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { sync } = yield* setupStaleForwardFixture();
            const trades = [
                buildAdaTrade(FIRST_TRADE_ID, Date.now() - FUTURE_TRADE_OFFSET_MS),
                buildAdaTrade(SECOND_TRADE_ID, Date.now() + FUTURE_TRADE_OFFSET_MS)
            ];

            binanceStub.myTrades({ ADAUSDT: trades });
            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([firstTradeExternalId]);
            expect(yield* readStoredCursor(sync.id)).toBe(JSON.stringify({ ADAUSDT: FIRST_TRADE_ID }));

            yield* makeSyncDueAgain(sync.id);
            binanceStub.serverTime(SERVER_AHEAD_MS);
            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([firstTradeExternalId, secondTradeExternalId]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('measures the trade window end on the Binance server clock', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupStaleForwardFixture();
            binanceStub.serverTime(SERVER_AHEAD_MS);
            binanceStub.myTrades({ ADAUSDT: [buildAdaTrade(FIRST_TRADE_ID, Date.now() + FUTURE_TRADE_OFFSET_MS)] });

            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([firstTradeExternalId]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the cursor in place when writing the fetched transfers fails partway', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { sync } = yield* setupStaleForwardFixture();

            binanceStub.myTrades({
                ADAUSDT: [buildAdaTrade(FIRST_TRADE_ID, Date.now()), buildAdaTrade(SECOND_TRADE_ID, Date.now())]
            });
            yield* testDb.run(
                sql.raw(
                    `CREATE TRIGGER fail_second_trade BEFORE INSERT ON transactions WHEN NEW.external_id = '${secondTradeExternalId}' BEGIN SELECT RAISE(ABORT, 'write failed'); END`
                )
            );

            yield* binanceSyncService.sync();

            expect(yield* readStoredCursor(sync.id)).toBeNull();

            yield* testDb.run(sql.raw('DROP TRIGGER fail_second_trade'));
            yield* makeSyncDueAgain(sync.id);
            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([firstTradeExternalId, secondTradeExternalId]);
            expect(yield* readStoredCursor(sync.id)).toBe(JSON.stringify({ ADAUSDT: SECOND_TRADE_ID }));
        }).pipe(Effect.provide(TestLayer))
    );
});
