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
    buildBinance,
    stubBinanceServerTime,
    stubEmptyC2cAndEarnRewards
} from '../../harness';
import { binanceServer } from '../../harness/binance/binance-server';

describe('binance/per-run-cache', () => {
    it('serves the second asset in the same wallet from the cached window without re-fetching', async () => {
        stubBinanceServerTime();
        binanceServer.use(http.get(FIAT_ORDERS_URL, () => HttpResponse.json(EMPTY_FIAT_RESPONSE)));
        stubEmptyC2cAndEarnRewards();
        binanceServer.use(http.get(WITHDRAW_URL, () => HttpResponse.json([])));
        binanceServer.use(http.get(DEPOSIT_URL, () => HttpResponse.json([])));
        binanceServer.use(
            http.get(
                DEPOSIT_URL,
                () =>
                    HttpResponse.json([
                        buildBinance.deposit({ id: 'dep-btc', coin: 'BTC', amount: '1' }),
                        buildBinance.deposit({ id: 'dep-eth', coin: 'ETH', amount: '2' })
                    ]),
                { once: true }
            )
        );

        const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
        const btcResult = await client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO);
        const ethResult = await client.getTransactions('SPOT:ETH', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO);

        expect(btcResult.success).toBe(true);
        expect(ethResult.success).toBe(true);
        if (btcResult.success && ethResult.success) {
            expect(btcResult.data.map(transaction => transaction.id)).toEqual(['dep-btc']);
            expect(ethResult.data.map(transaction => transaction.id)).toEqual(['dep-eth']);
        }
    });
});
