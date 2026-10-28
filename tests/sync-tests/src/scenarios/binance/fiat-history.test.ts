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
    jumpPastDeadline,
    restoreRealTimers,
    resyncBinance,
    RUN_DEADLINE_MS,
    seedSecondKeyAccount,
    setupFiatScenario,
    TestLayer,
    testDb
} from '../../harness';

import type { TimeWindow } from '../../harness';

const DAY_MS = 86_400_000;
const KEY_B = 'key-b';
const SECOND_CHUNK_REQUEST = 40;

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
                { apiKey: KEY_B, uid: 1002, spotBalances: [] }
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

    it.effect('resumes a deferred fiat backfill from the persisted progress instead of restarting', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const order = buildBinance.fiatOrder({
                orderNo: 'fiat-deep',
                fiatCurrency: 'EUR',
                amount: '100',
                createTime: Date.now() - 1100 * DAY_MS
            });
            let servedCount = 0;

            const { sync, token } = yield* setupFiatScenario();
            binanceStub.fiatOrders([order], [], [], [], {
                onServed: () => {
                    servedCount += 1;
                    if (servedCount === SECOND_CHUNK_REQUEST) {
                        jumpPastDeadline();
                    }
                }
            });
            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS).pipe(Effect.ensuring(restoreRealTimers));

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([]);
            expect((yield* fetchHistoryProgress(token))['FIAT'].tailAt).toBeLessThan(Date.now() - 300 * DAY_MS);

            const resumedWindows: TimeWindow[] = [];
            binanceStub.fiatOrders([order], [], resumedWindows);
            yield* resyncBinance(sync.id);

            expect(yield* fetchSortedBinanceExternalIds()).toEqual(['fiat-deep']);
            expect(
                resumedWindows.filter(window => window.endMs < Date.now() - 100 * DAY_MS && window.endMs > Date.now() - 340 * DAY_MS)
            ).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});
