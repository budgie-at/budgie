import { SyncEntityTable, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    seedCryptoInstrument,
    seedSecondKeyAccount,
    setupBinanceFixture,
    STALE_SYNC_AGE_MS,
    TestLayer,
    testDb
} from '../../harness';

import type { TimeWindow } from '../../harness';

const DAY_MS = 86_400_000;
const EXTRA_ASSETS = ['BTC', 'ETH', 'SOL'];

describe('binance/multi-account-backfill', () => {
    it.effect('backfills every account of a key in one run and does not walk the history again', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const nowMs = Date.now();

            const { token } = yield* setupBinanceFixture({ asset: 'USDT' });
            for (const asset of EXTRA_ASSETS) {
                yield* seedSecondKeyAccount(asset, (yield* seedCryptoInstrument(asset)).id, token);
            }
            binanceStub.withdrawals([
                buildBinance.withdrawal({
                    id: 'wd-old',
                    coin: 'USDT',
                    amount: '1',
                    applyTime: new Date(nowMs - 900 * DAY_MS).toISOString()
                })
            ]);
            binanceStub.earnRewards([buildBinance.earnReward({ asset: 'USDT', rewards: '1', time: nowMs - 400 * DAY_MS })]);

            yield* binanceSyncService.sync();

            const syncs = yield* testDb.select().from(SyncEntityTable);
            expect(syncs).toHaveLength(EXTRA_ASSETS.length + 1);
            expect(syncs.filter(sync => sync.mode === SyncModeEnum.BACKWARD)).toEqual([]);

            yield* testDb
                .update(SyncEntityTable)
                .set({ forwardSyncedAt: new Date(Date.now() - STALE_SYNC_AGE_MS), status: SyncStatusEnum.IDLE })
                .where(eq(SyncEntityTable.provider, syncs[0].provider));
            const withdrawalWindows: TimeWindow[] = [];
            binanceStub.serverTime();
            binanceStub.withdrawals([], withdrawalWindows);
            yield* binanceSyncService.sync();

            expect(withdrawalWindows.length).toBeGreaterThan(0);
            expect(withdrawalWindows.filter(window => window.startMs < Date.now() - 3 * DAY_MS)).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});
