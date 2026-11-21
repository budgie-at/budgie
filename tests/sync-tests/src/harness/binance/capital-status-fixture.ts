import { SyncModeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import { fetchSyncById } from '../db/fetch-sync-by-id';

import { fetchBinanceTransactions, resyncBinance, stubEmptyBinanceBalances } from './binance-scenario';
import { binanceStub } from './binance-stub';
import { buildBinance } from './build-binance';
import { setupBinanceFixture } from './setup-binance-fixture';

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

export const stubDeposit = (status: number | undefined, timeMs: number): void => {
    binanceStub.deposits([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '2', insertTime: timeMs, status })]);
};

export const stubWithdrawal = (status: number | undefined, timeMs: number): void => {
    binanceStub.withdrawals([
        buildBinance.withdrawal({
            id: 'wd-1',
            coin: 'BTC',
            amount: '1',
            transactionFee: '0.1',
            applyTime: new Date(timeMs).toISOString(),
            status
        })
    ]);
};

export const startForwardSync = Effect.gen(function* () {
    const fixture = yield* setupBinanceFixture({ mode: SyncModeEnum.FORWARD, forwardSyncFromAt: new Date(Date.now() - HOUR_MS) });
    stubEmptyBinanceBalances();

    return fixture;
});

export const importedCountsAfterEachStatus = (stubHistory: typeof stubDeposit, ageMs: number, statuses: readonly (number | undefined)[]) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;
        const { sync } = yield* startForwardSync;
        const timeMs = Date.now() - ageMs;
        const counts: number[] = [];

        for (const [index, status] of statuses.entries()) {
            stubHistory(status, timeMs);
            yield* index === 0 ? binanceSyncService.sync() : resyncBinance(sync.id);
            counts.push((yield* fetchBinanceTransactions).length);
        }

        return counts;
    });

export const pendingAnchorAfterFirstSync = (stubHistory: typeof stubDeposit, ageMs: number) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;
        const { sync } = yield* startForwardSync;
        stubHistory(0, Date.now() - ageMs);

        yield* binanceSyncService.sync();

        return (yield* fetchSyncById(sync.id)).binanceCapitalPendingFromAt;
    });
