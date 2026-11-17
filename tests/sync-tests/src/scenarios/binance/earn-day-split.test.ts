import { SyncModeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import {
    binanceStub,
    buildBinance,
    buildEarnDayKey,
    fetchBinanceEntriesByExternalId,
    fetchHistoryProgress,
    jumpPastDeadline,
    restoreRealTimers,
    resyncBinance,
    RUN_DEADLINE_MS,
    setupBinanceFixture,
    TestLayer
} from '../../harness';

import type { TimeWindow } from '../../harness';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const EARN_WINDOW_MS = 30 * DAY_MS;
const DEFER_AT_REQUEST = 4;
const MICRO_UNITS = 1_000_000;

const deferAtRequest = (requestNumber: number) => {
    let servedCount = 0;

    return (): void => {
        servedCount += 1;
        if (servedCount === requestNumber) {
            jumpPastDeadline();
        }
    };
};

describe('binance/earn-day-split', () => {
    it.effect('keeps the full day total when a deferred backfill resumes in the middle of a UTC day', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const nowMs = Math.floor(Date.now() / DAY_MS) * DAY_MS - DAY_MS + 12 * HOUR_MS;
            vi.useFakeTimers({ now: nowMs, toFake: ['Date'] });
            const legacyFrontierMs = nowMs - DEFER_AT_REQUEST * (EARN_WINDOW_MS + 1);
            const rewards = [
                buildBinance.earnReward({ asset: 'USDT', rewards: '1', time: legacyFrontierMs - 10 * MINUTE_MS }),
                buildBinance.earnReward({ asset: 'USDT', rewards: '1', time: legacyFrontierMs + 10 * MINUTE_MS })
            ];

            const { sync, token } = yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            binanceStub.earnRewards(rewards, [], { onServed: deferAtRequest(DEFER_AT_REQUEST) });
            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS);
            expect((yield* fetchHistoryProgress(token))['EARN'].tailAt).toBeGreaterThan(nowMs - 200 * DAY_MS);

            jumpPastDeadline();
            binanceStub.earnRewards(rewards, [], { onServed: emptyFn });
            yield* resyncBinance(sync.id);

            const entries = yield* fetchBinanceEntriesByExternalId(`binance:earn:USDT:${buildEarnDayKey(legacyFrontierMs)}`);
            expect(entries).toHaveLength(1);
            expect(entries[0].amount).toBe(2 * MICRO_UNITS);
        }).pipe(Effect.ensuring(restoreRealTimers), Effect.provide(TestLayer))
    );

    it.effect('splits the earn reward walk on UTC day boundaries', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const requestedWindows: TimeWindow[] = [];
            yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            binanceStub.earnRewards([], requestedWindows);

            yield* binanceSyncService.sync();

            expect(requestedWindows.length).toBeGreaterThan(1);
            for (const window of requestedWindows) {
                expect(window.startMs % DAY_MS).toBe(0);
            }
            for (const window of requestedWindows.slice(1)) {
                expect((window.endMs + 1) % DAY_MS).toBe(0);
            }
        }).pipe(Effect.provide(TestLayer))
    );
});
