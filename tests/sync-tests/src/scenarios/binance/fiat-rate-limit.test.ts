import { BinanceSignedClient } from '@budgie/sync';
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
    stubBinanceServerTime,
    stubEmptyC2cAndEarnRewards,
    withCoolDownSpy
} from '../../harness';
import { binanceServer } from '../../harness/binance/binance-server';

const NEAR_CEILING_UID_WEIGHT = '80000';
const COOL_DOWN_WINDOW_MS = 60_000;

describe('binance/fiat-rate-limit', () => {
    it('schedules a cool-down before the next heavy call when fiat used-weight crosses the ceiling threshold', async () => {
        stubBinanceServerTime();
        binanceServer.use(http.get(DEPOSIT_URL, () => HttpResponse.json([])));
        binanceServer.use(http.get(WITHDRAW_URL, () => HttpResponse.json([])));
        stubEmptyC2cAndEarnRewards();
        binanceServer.use(
            http.get(FIAT_ORDERS_URL, () =>
                HttpResponse.json(EMPTY_FIAT_RESPONSE, { headers: { 'x-sapi-used-uid-weight-1m': NEAR_CEILING_UID_WEIGHT } })
            )
        );

        const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
        const coolDownDelays = await withCoolDownSpy(COOL_DOWN_WINDOW_MS, async () => {
            const result = await client.getTransactions('SPOT:EUR', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO);

            expect(result.success).toBe(true);
        });

        expect(coolDownDelays).toContain(COOL_DOWN_WINDOW_MS);
    });
});
