import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { binanceStub, setupBinanceFixture, stubEmptyBinanceBalances, TestLayer } from '../../harness';

import type { TimeWindow } from '../../harness';

describe('binance/window-boundary', () => {
    it.effect('requests adjacent history windows without sharing a boundary millisecond', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const requestedWindows: TimeWindow[] = [];
            yield* setupBinanceFixture();
            stubEmptyBinanceBalances();
            binanceStub.deposits([], requestedWindows);

            yield* binanceSyncService.sync();

            expect(requestedWindows.length).toBeGreaterThan(1);
            for (const [index, window] of requestedWindows.slice(1).entries()) {
                expect(window.endMs).toBe(requestedWindows[index].startMs - 1);
            }
        }).pipe(Effect.provide(TestLayer))
    );
});
