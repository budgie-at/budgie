import { BankSyncErrorCodeEnum, BinanceSignedClient } from '@budgie/bank-sync';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { buildBinance } from '../../harness';
import { binanceServer } from '../../harness/binance/binance-server';

const TOKEN = JSON.stringify({ apiKey: 'k', apiSecret: 's' });
const FROM = 1_700_000_000;
const TO = 1_707_000_000;
const SERVER_TIME_URL = 'https://api.binance.com/api/v3/time';
const DEPOSIT_URL = 'https://api.binance.com/sapi/v1/capital/deposit/hisrec';
const WITHDRAW_URL = 'https://api.binance.com/sapi/v1/capital/withdraw/history';
const FIAT_ORDERS_URL = 'https://api.binance.com/sapi/v1/fiat/orders';
const C2C_ORDERS_URL = 'https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory';
const EARN_REWARDS_URL = 'https://api.binance.com/sapi/v1/simple-earn/flexible/history/rewardsRecord';
const NEAR_CEILING_UID_WEIGHT = '80000';
const COOL_DOWN_WINDOW_MS = 60_000;
const EMPTY_FIAT_RESPONSE = { code: '000000', message: 'success', data: [], total: 0, success: true };
const EMPTY_C2C_RESPONSE = { code: '000000', message: 'success', data: [], total: 0, success: true };
const EMPTY_EARN_REWARDS_RESPONSE = { rows: [], total: 0 };

const stubSpotSecondarySources = (): void => {
    binanceServer.use(http.get(C2C_ORDERS_URL, () => HttpResponse.json(EMPTY_C2C_RESPONSE)));
    binanceServer.use(http.get(EARN_REWARDS_URL, () => HttpResponse.json(EMPTY_EARN_REWARDS_RESPONSE)));
};

describe('binance/rate-limit', () => {
    it('maps a 429 deposit response to a rate-limited error', async () => {
        binanceServer.use(http.get(SERVER_TIME_URL, () => HttpResponse.json({ serverTime: Date.now() })));
        binanceServer.use(http.get(FIAT_ORDERS_URL, () => HttpResponse.json(EMPTY_FIAT_RESPONSE)));
        stubSpotSecondarySources();
        binanceServer.use(http.get(DEPOSIT_URL, () => new HttpResponse(null, { status: 429 })));
        binanceServer.use(http.get(WITHDRAW_URL, () => HttpResponse.json([])));

        const client = new BinanceSignedClient(TOKEN);
        const result = await client.getTransactions('SPOT:BTC', FROM, TO);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe(BankSyncErrorCodeEnum.RATE_LIMITED);
        }
    });

    it('schedules a cool-down before the next heavy call when used-weight crosses the ceiling threshold', async () => {
        binanceServer.use(http.get(SERVER_TIME_URL, () => HttpResponse.json({ serverTime: Date.now() })));
        binanceServer.use(http.get(FIAT_ORDERS_URL, () => HttpResponse.json(EMPTY_FIAT_RESPONSE)));
        stubSpotSecondarySources();
        binanceServer.use(
            http.get(DEPOSIT_URL, () =>
                HttpResponse.json([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '1' })], {
                    headers: { 'x-sapi-used-uid-weight-1m': NEAR_CEILING_UID_WEIGHT }
                })
            )
        );
        binanceServer.use(http.get(WITHDRAW_URL, () => HttpResponse.json([])));

        const coolDownDelays: number[] = [];
        const realSetTimeout = globalThis.setTimeout;
        const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((handler: TimerHandler, delay?: number, ...args) => {
            if (typeof handler === 'function' && delay === COOL_DOWN_WINDOW_MS) {
                coolDownDelays.push(delay);
                handler();

                return 0 as unknown as ReturnType<typeof setTimeout>;
            }

            return realSetTimeout(handler, delay, ...args);
        });
        try {
            const client = new BinanceSignedClient(TOKEN);
            await client.getTransactions('SPOT:BTC', FROM, TO);

            const result = await client.getTransactions('SPOT:BTC', FROM, TO + 1);

            expect(coolDownDelays).toContain(COOL_DOWN_WINDOW_MS);
            expect(result.success).toBe(true);
        } finally {
            setTimeoutSpy.mockRestore();
        }
    });
});
