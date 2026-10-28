import { SyncModeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import {
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    TestLayer
} from '../../harness';

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PART_LENGTH = 10;
const NON_UTC_TIMEZONES = ['Pacific/Auckland', 'America/Los_Angeles'];

const withTimezone = <A, E, R>(timezone: string, effect: Effect.Effect<A, E, R>) =>
    Effect.acquireUseRelease(
        Effect.sync(() => {
            const previousTimezone = process.env['TZ'];
            process.env['TZ'] = timezone;

            return previousTimezone;
        }),
        () => effect,
        previousTimezone =>
            Effect.sync(() => {
                if (isDefined(previousTimezone)) {
                    process.env['TZ'] = previousTimezone;
                } else {
                    delete process.env['TZ'];
                }
            })
    );

describe('binance/withdrawal-time', () => {
    it.effect.each(NON_UTC_TIMEZONES)('books a 23:30 UTC withdrawal on its UTC day under %s', timezone =>
        withTimezone(
            timezone,
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;
                const utcDay = new Date(Date.now() - 3 * DAY_MS).toISOString().slice(0, DATE_PART_LENGTH);
                yield* setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
                stubEmptyBinanceBalances();
                binanceStub.withdrawals([
                    buildBinance.withdrawal({ id: 'wd-utc', coin: 'BTC', amount: '1', applyTime: `${utcDay} 23:30:00` })
                ]);

                yield* binanceSyncService.sync();

                const transactions = yield* fetchBinanceTransactions();
                expect(transactions).toHaveLength(1);
                expect(transactions[0].operatedAt.toISOString()).toBe(`${utcDay}T23:30:00.000Z`);
            })
        ).pipe(Effect.provide(TestLayer))
    );
});
