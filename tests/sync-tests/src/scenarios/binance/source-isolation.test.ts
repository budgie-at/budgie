import { SyncStatusEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceErrorResponse,
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    fetchHistoryProgress,
    fetchSyncById,
    recentDayInMonthsAgo,
    setupBinanceFixture,
    TestLayer
} from '../../harness';

const HOUR_MS = 3_600_000;
const HTTP_NOT_FOUND_STATUS = 404;
const DIVIDEND_TRAN_ID = 9201;

const setupDepositAndDividend = Effect.gen(function* () {
    const fixture = yield* setupBinanceFixture({ asset: 'USDT' });
    binanceStub.deposits([buildBinance.deposit({ id: 'dep-survives', coin: 'USDT', amount: '5' })]);
    binanceStub.dividends([
        buildBinance.dividend({ tranId: DIVIDEND_TRAN_ID, asset: 'USDT', amount: '1', divTime: recentDayInMonthsAgo(1) + HOUR_MS })
    ]);

    return fixture;
});

describe('binance/source-isolation', () => {
    it.effect('skips an optional source answering 404 and books the other sources without failing the run', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { sync } = yield* setupDepositAndDividend;
            binanceStub.failEndpoint('ethStakingRewards', () => new Response(null, { status: HTTP_NOT_FOUND_STATUS }));

            yield* binanceSyncService.sync();

            expect(yield* fetchBinanceTransactions()).toHaveLength(2);
            expect((yield* fetchSyncById(sync.id)).status).not.toBe(SyncStatusEnum.FAILED);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('books the sources after a failing required source and records the failure for retry', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { sync, token } = yield* setupDepositAndDividend;
            binanceStub.failEndpoint('earnRewards', () => binanceErrorResponse.apiError(-1100, 'Illegal characters found in parameter.'));

            yield* binanceSyncService.sync();

            expect(yield* fetchBinanceTransactions()).toHaveLength(2);
            expect((yield* fetchHistoryProgress(token))['EARN']).toBeUndefined();
            const failedSync = yield* fetchSyncById(sync.id);
            expect(failedSync.status).toBe(SyncStatusEnum.FAILED);
            expect(failedSync.lastError).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
