import { HttpResponse, http } from 'msw';

import { mockServer } from '../scenario/mock-server';

export const BINANCE_TEST_TOKEN = JSON.stringify({ apiKey: 'k', apiSecret: 's' });
export const BINANCE_WINDOW_FROM = 1_700_000_000;
export const BINANCE_WINDOW_TO = 1_707_000_000;

const SERVER_TIME_URL = 'https://api.binance.com/api/v3/time';
export const DEPOSIT_URL = 'https://api.binance.com/sapi/v1/capital/deposit/hisrec';
export const WITHDRAW_URL = 'https://api.binance.com/sapi/v1/capital/withdraw/history';
export const FIAT_ORDERS_URL = 'https://api.binance.com/sapi/v1/fiat/orders';
const C2C_ORDERS_URL = 'https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory';
const EARN_REWARDS_URL = 'https://api.binance.com/sapi/v1/simple-earn/flexible/history/rewardsRecord';

export const EMPTY_FIAT_RESPONSE = { code: '000000', message: 'success', data: [], total: 0, success: true };
const EMPTY_C2C_RESPONSE = { code: '000000', message: 'success', data: [], total: 0, success: true };
const EMPTY_EARN_REWARDS_RESPONSE = { rows: [], total: 0 };

export const stubBinanceServerTime = (): void => {
    mockServer.use(http.get(SERVER_TIME_URL, () => HttpResponse.json({ serverTime: Date.now() })));
};

export const stubEmptyC2cAndEarnRewards = (): void => {
    mockServer.use(http.get(C2C_ORDERS_URL, () => HttpResponse.json(EMPTY_C2C_RESPONSE)));
    mockServer.use(http.get(EARN_REWARDS_URL, () => HttpResponse.json(EMPTY_EARN_REWARDS_RESPONSE)));
};
