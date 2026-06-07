import { BinanceSignedClient } from '@budgie/bank-sync';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildBinance } from '../../harness';
import { binanceServer } from '../../harness/binance/binance-server';

const TOKEN = JSON.stringify({ apiKey: 'k', apiSecret: 's' });
const FROM = 1_700_000_000;
const TO = 1_707_000_000;
const DEPOSIT_URL = 'https://api.binance.com/sapi/v1/capital/deposit/hisrec';
const WITHDRAW_URL = 'https://api.binance.com/sapi/v1/capital/withdraw/history';
const FIAT_ORDERS_URL = 'https://api.binance.com/sapi/v1/fiat/orders';
const C2C_ORDERS_URL = 'https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory';
const EARN_REWARDS_URL = 'https://api.binance.com/sapi/v1/simple-earn/flexible/history/rewardsRecord';
const SERVER_TIME_URL = 'https://api.binance.com/api/v3/time';
const EMPTY_FIAT_RESPONSE = { code: '000000', message: 'success', data: [], total: 0, success: true };
const EMPTY_C2C_RESPONSE = { code: '000000', message: 'success', data: [], total: 0, success: true };
const EMPTY_EARN_REWARDS_RESPONSE = { rows: [], total: 0 };

describe('binance/per-run-cache', () => {
    it('serves the second asset in the same wallet from the cached window without re-fetching', async () => {
        binanceServer.use(http.get(SERVER_TIME_URL, () => HttpResponse.json({ serverTime: Date.now() })));
        binanceServer.use(http.get(FIAT_ORDERS_URL, () => HttpResponse.json(EMPTY_FIAT_RESPONSE)));
        binanceServer.use(http.get(C2C_ORDERS_URL, () => HttpResponse.json(EMPTY_C2C_RESPONSE)));
        binanceServer.use(http.get(EARN_REWARDS_URL, () => HttpResponse.json(EMPTY_EARN_REWARDS_RESPONSE)));
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

        const client = new BinanceSignedClient(TOKEN);
        const btcResult = await client.getTransactions('SPOT:BTC', FROM, TO);
        const ethResult = await client.getTransactions('SPOT:ETH', FROM, TO);

        expect(btcResult.success).toBe(true);
        expect(ethResult.success).toBe(true);
        if (btcResult.success && ethResult.success) {
            expect(btcResult.data.map(transaction => transaction.id)).toEqual(['dep-btc']);
            expect(ethResult.data.map(transaction => transaction.id)).toEqual(['dep-eth']);
        }
    });
});
