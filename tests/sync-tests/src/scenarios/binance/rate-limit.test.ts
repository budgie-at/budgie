import { BinanceSignedClient } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import {
    BINANCE_TEST_TOKEN,
    BINANCE_WINDOW_FROM,
    BINANCE_WINDOW_TO,
    DEPOSIT_URL,
    EMPTY_FIAT_RESPONSE,
    FIAT_ORDERS_URL,
    WITHDRAW_URL,
    buildBinance,
    stubBinanceServerTime,
    stubEmptyC2cAndEarnRewards,
    withCoolDownSpy,
    run
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const NEAR_CEILING_UID_WEIGHT = '80000';
const COOL_DOWN_WINDOW_MS = 60_000;

describe('binance/rate-limit', () => {
    it('returns a dedicated deferred error when the signed request deadline has expired', async () => {
        stubBinanceServerTime();

        const client = new BinanceSignedClient(BINANCE_TEST_TOKEN, Date.now() - 1);
        const error = await run(Effect.flip(client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO)));

        expect(error._tag).toBe('SyncDeferredError');
    });

    it('maps a 429 deposit response to a rate-limited error', async () => {
        stubBinanceServerTime();
        mockServer.use(http.get(FIAT_ORDERS_URL, () => HttpResponse.json(EMPTY_FIAT_RESPONSE)));
        stubEmptyC2cAndEarnRewards();
        mockServer.use(http.get(DEPOSIT_URL, () => new HttpResponse(null, { status: 429 })));
        mockServer.use(http.get(WITHDRAW_URL, () => HttpResponse.json([])));

        const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
        const error = await run(Effect.flip(client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO)));

        expect(error._tag).toBe('SyncRateLimitedError');
    });

    it('schedules a cool-down before the next heavy call when used-weight crosses the ceiling threshold', async () => {
        stubBinanceServerTime();
        mockServer.use(http.get(FIAT_ORDERS_URL, () => HttpResponse.json(EMPTY_FIAT_RESPONSE)));
        stubEmptyC2cAndEarnRewards();
        mockServer.use(
            http.get(DEPOSIT_URL, () =>
                HttpResponse.json([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '1' })], {
                    headers: { 'x-sapi-used-uid-weight-1m': NEAR_CEILING_UID_WEIGHT }
                })
            )
        );
        mockServer.use(http.get(WITHDRAW_URL, () => HttpResponse.json([])));

        const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
        const coolDownDelays = await withCoolDownSpy(COOL_DOWN_WINDOW_MS, async () => {
            await run(client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO));

            await run(client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO + 1));
        });

        expect(coolDownDelays).toContain(COOL_DOWN_WINDOW_MS);
    });
});
