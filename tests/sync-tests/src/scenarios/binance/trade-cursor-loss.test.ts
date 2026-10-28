import { SyncEntityTable, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import {
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    fetchSortedBinanceExternalIds,
    fetchSyncById,
    seedCryptoInstrument,
    setupBinanceFixture,
    testDb,
    TestLayer
} from '../../harness';

const STALE_SYNC_AGE_MS = 5 * 60 * 1000;
const RUN_DEADLINE_MS = 2 * 1000;
const DEADLINE_JUMP_MS = 4 * 1000;
const FUTURE_TRADE_OFFSET_MS = 30 * 1000;
const SERVER_AHEAD_MS = 2 * 60 * 1000;
const FIRST_TRADE_ID = 10;
const SECOND_TRADE_ID = 11;

const firstTradeExternalId = `binance:trade:ADAUSDT:${FIRST_TRADE_ID}`;
const secondTradeExternalId = `binance:trade:ADAUSDT:${SECOND_TRADE_ID}`;

const buildAdaTrade = (id: number, time: number) =>
    buildBinance.trade({ symbol: 'ADAUSDT', id, qty: '10', quoteQty: '5', commission: '0', isBuyer: true, time });

const setupAdaBnbFixture = Effect.fnUntraced(function* () {
    yield* seedCryptoInstrument('ADA');
    yield* seedCryptoInstrument('BNB');
    const { sync } = yield* setupBinanceFixture({
        asset: 'USDT',
        mode: SyncModeEnum.FORWARD,
        forwardSyncedAt: new Date(Date.now() - STALE_SYNC_AGE_MS)
    });

    binanceStub.exchangeInfo(['ADAUSDT', 'BNBUSDT']);
    binanceStub.spotBalances([
        buildBinance.balance({ asset: 'USDT', free: '100' }),
        buildBinance.balance({ asset: 'ADA', free: '200' }),
        buildBinance.balance({ asset: 'BNB', free: '1' })
    ]);

    return sync.id;
});

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
            const syncId = yield* setupAdaBnbFixture();

            binanceStub.myTrades({ ADAUSDT: [buildAdaTrade(FIRST_TRADE_ID, Date.now())] }, new Set<string>(), [], symbol => {
                if (symbol === 'ADAUSDT') {
                    vi.setSystemTime(Date.now() + DEADLINE_JUMP_MS);
                }
            });

            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS).pipe(Effect.ensuring(Effect.sync(() => vi.useRealTimers())));

            expect(yield* fetchBinanceTransactions()).toHaveLength(0);
            expect(yield* readStoredCursor(syncId)).toBeNull();

            binanceStub.myTrades({ ADAUSDT: [buildAdaTrade(FIRST_TRADE_ID, Date.now())] });
            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([firstTradeExternalId]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('imports a trade that landed after the run started on the next run', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const syncId = yield* setupAdaBnbFixture();
            const trades = [
                buildAdaTrade(FIRST_TRADE_ID, Date.now() - FUTURE_TRADE_OFFSET_MS),
                buildAdaTrade(SECOND_TRADE_ID, Date.now() + FUTURE_TRADE_OFFSET_MS)
            ];

            binanceStub.myTrades({ ADAUSDT: trades });
            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([firstTradeExternalId]);
            expect(yield* readStoredCursor(syncId)).toBe(JSON.stringify({ ADAUSDT: FIRST_TRADE_ID }));

            yield* makeSyncDueAgain(syncId);
            binanceStub.serverTime(SERVER_AHEAD_MS);
            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([firstTradeExternalId, secondTradeExternalId]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('measures the trade window end on the Binance server clock', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupAdaBnbFixture();
            binanceStub.serverTime(SERVER_AHEAD_MS);
            binanceStub.myTrades({ ADAUSDT: [buildAdaTrade(FIRST_TRADE_ID, Date.now() + FUTURE_TRADE_OFFSET_MS)] });

            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([firstTradeExternalId]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the cursor in place when writing the fetched transfers fails partway', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const syncId = yield* setupAdaBnbFixture();

            binanceStub.myTrades({
                ADAUSDT: [buildAdaTrade(FIRST_TRADE_ID, Date.now()), buildAdaTrade(SECOND_TRADE_ID, Date.now())]
            });
            yield* testDb.run(
                sql.raw(
                    `CREATE TRIGGER fail_second_trade BEFORE INSERT ON transactions WHEN NEW.external_id = '${secondTradeExternalId}' BEGIN SELECT RAISE(ABORT, 'write failed'); END`
                )
            );

            yield* binanceSyncService.sync();

            expect(yield* readStoredCursor(syncId)).toBeNull();

            yield* testDb.run(sql.raw('DROP TRIGGER fail_second_trade'));
            yield* makeSyncDueAgain(syncId);
            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([firstTradeExternalId, secondTradeExternalId]);
            expect(yield* readStoredCursor(syncId)).toBe(JSON.stringify({ ADAUSDT: SECOND_TRADE_ID }));
        }).pipe(Effect.provide(TestLayer))
    );
});
