import { SyncErrorCodeEnum, BinanceSignedClient } from '@budgie/sync';
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
    withCoolDownSpy
} from '../../harness';
import { binanceServer } from '../../harness/binance/binance-server';

const NEAR_CEILING_UID_WEIGHT = '80000';
const COOL_DOWN_WINDOW_MS = 60_000;

describe('binance/rate-limit', () => {
    it('maps a 429 deposit response to a rate-limited error', async () => {
        stubBinanceServerTime();
        binanceServer.use(http.get(FIAT_ORDERS_URL, () => HttpResponse.json(EMPTY_FIAT_RESPONSE)));
        stubEmptyC2cAndEarnRewards();
        binanceServer.use(http.get(DEPOSIT_URL, () => new HttpResponse(null, { status: 429 })));
        binanceServer.use(http.get(WITHDRAW_URL, () => HttpResponse.json([])));

        const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
        const result = await client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe(SyncErrorCodeEnum.RATE_LIMITED);
        }
    });

    it('schedules a cool-down before the next heavy call when used-weight crosses the ceiling threshold', async () => {
        stubBinanceServerTime();
        binanceServer.use(http.get(FIAT_ORDERS_URL, () => HttpResponse.json(EMPTY_FIAT_RESPONSE)));
        stubEmptyC2cAndEarnRewards();
        binanceServer.use(
            http.get(DEPOSIT_URL, () =>
                HttpResponse.json([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '1' })], {
                    headers: { 'x-sapi-used-uid-weight-1m': NEAR_CEILING_UID_WEIGHT }
                })
            )
        );
        binanceServer.use(http.get(WITHDRAW_URL, () => HttpResponse.json([])));

        const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
        const coolDownDelays = await withCoolDownSpy(COOL_DOWN_WINDOW_MS, async () => {
            await client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO);

            const result = await client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO + 1);

            expect(result.success).toBe(true);
        });

        expect(coolDownDelays).toContain(COOL_DOWN_WINDOW_MS);
    });
});
