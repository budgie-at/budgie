import { TransactionEntryEntityTable } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    buildBinanceToken,
    fetchHistoryProgress,
    fetchSortedBinanceExternalIds,
    seedSecondKeyAccount,
    setupFiatScenario,
    TestLayer,
    testDb
} from '../../harness';

import type { TimeWindow } from '../../harness';

const DAY_MS = 86_400_000;
const KEY_B = 'key-b';
const HISTORY_START_MS = Date.UTC(2017, 6, 1);
const FIAT_PAGE_SIZE = 500;

describe('binance/fiat-history', () => {
    it.effect.each([
        { age: 200, name: 'older than 90 quiet days' },
        { age: 1100, name: 'about three years old' }
    ])('imports a fiat order $name', ({ age }) =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupFiatScenario();
            binanceStub.fiatOrders(
                [
                    buildBinance.fiatOrder({
                        orderNo: 'fiat-old',
                        fiatCurrency: 'EUR',
                        amount: '100',
                        createTime: Date.now() - age * DAY_MS
                    })
                ],
                []
            );

            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual(['fiat-old']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { status: 'Successful', isImported: true },
        { status: 'Finished', isImported: true },
        { status: 'Order Partial Credit Stopped', isImported: false },
        { status: 'Expired', isImported: false }
    ])('imports fiat orders with status $status: $isImported', ({ status, isImported }) =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupFiatScenario();
            binanceStub.fiatOrders([buildBinance.fiatOrder({ orderNo: 'fiat-status', fiatCurrency: 'EUR', amount: '100', status })], []);

            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toHaveLength(isImported ? 1 : 0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('gives a new key its fiat history within 23h of another key refreshing fiat', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { instrument } = yield* setupFiatScenario();
            binanceStub.accountsByApiKey([
                { apiKey: 'test-api-key', uid: 1001, spotBalances: [] },
                { apiKey: KEY_B, uid: 1002, spotBalances: [buildBinance.balance({ asset: 'EUR', free: '100' })] }
            ]);
            yield* binanceSyncService.sync();

            const accountB = yield* seedSecondKeyAccount('EUR', instrument.id, buildBinanceToken(KEY_B));
            binanceStub.fiatOrders([buildBinance.fiatOrder({ orderNo: 'fiat-key-b', fiatCurrency: 'EUR', amount: '100' })], []);
            yield* binanceSyncService.sync();

            const entries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.accountId, accountB.id));
            expect(entries.map(entry => entry.externalId)).toEqual(['fiat-key-b']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('fetches the whole fiat history in one request per transaction type', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const fiatWindows: TimeWindow[] = [];

            yield* setupFiatScenario();
            binanceStub.fiatOrders(
                [
                    buildBinance.fiatOrder({
                        orderNo: 'fiat-deep',
                        fiatCurrency: 'EUR',
                        amount: '100',
                        createTime: Date.now() - 1100 * DAY_MS
                    })
                ],
                [],
                fiatWindows
            );
            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual(['fiat-deep']);
            expect(fiatWindows.map(window => window.startMs)).toEqual([HISTORY_START_MS, HISTORY_START_MS]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('pages through a fiat history larger than one page', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const fiatWindows: TimeWindow[] = [];
            const expiredOrders = Array.from({ length: FIAT_PAGE_SIZE + 1 }, (_, index) =>
                buildBinance.fiatOrder({ orderNo: `fiat-expired-${index}`, fiatCurrency: 'EUR', amount: '1', status: 'Expired' })
            );

            yield* setupFiatScenario();
            binanceStub.fiatOrders(expiredOrders, [], fiatWindows);
            yield* binanceSyncService.sync();

            expect(fiatWindows).toHaveLength(3);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('completes the fiat backfill when Binance omits data for empty responses', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { token } = yield* setupFiatScenario();
            binanceStub.fiatOrders([], []);
            binanceStub.fiatPayments([]);
            binanceStub.c2cOrders([], []);
            yield* binanceSyncService.sync();

            expect((yield* fetchHistoryProgress(token))['FIAT']).toBeDefined();
        }).pipe(Effect.provide(TestLayer))
    );
});
