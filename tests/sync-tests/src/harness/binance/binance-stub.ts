import { HttpResponse, http } from 'msw';

import { mockServer } from '../scenario/mock-server';

import type {
    BinanceAssetBalanceApiInterface,
    BinanceC2cOrderApiInterface,
    BinanceConvertFlowApiInterface,
    BinanceDepositApiInterface,
    BinanceEarnPositionApiInterface,
    BinanceEarnRewardApiInterface,
    BinanceFiatOrderApiInterface,
    BinanceLockedEarnPositionApiInterface,
    BinanceTradeApiInterface,
    BinanceWithdrawalApiInterface
} from '@budgie/sync';

const BASE_URL = 'https://api.binance.com';
const SERVER_TIME_URL = `${BASE_URL}/api/v3/time`;
const SPOT_BALANCE_URL = `${BASE_URL}/sapi/v3/asset/getUserAsset`;
const FUNDING_BALANCE_URL = `${BASE_URL}/sapi/v1/asset/get-funding-asset`;
const DEPOSIT_URL = `${BASE_URL}/sapi/v1/capital/deposit/hisrec`;
const WITHDRAW_URL = `${BASE_URL}/sapi/v1/capital/withdraw/history`;
const FIAT_ORDERS_URL = `${BASE_URL}/sapi/v1/fiat/orders`;
const C2C_ORDERS_URL = `${BASE_URL}/sapi/v1/c2c/orderMatch/listUserOrderHistory`;
const MY_TRADES_URL = `${BASE_URL}/api/v3/myTrades`;
const EXCHANGE_INFO_URL = `${BASE_URL}/api/v3/exchangeInfo`;
const EXCHANGE_INFO_BASE_ASSETS = ['ADA', 'BNB', 'BTC', 'ETH', 'EUR', 'PEPE', 'USDT'];
const EXCHANGE_INFO_QUOTE_ASSETS = ['USDT', 'FDUSD', 'BTC', 'BNB', 'BUSD'];

const buildAllValidSymbols = (): string[] => {
    const symbols: string[] = [];
    for (const baseAsset of EXCHANGE_INFO_BASE_ASSETS) {
        for (const quoteAsset of EXCHANGE_INFO_QUOTE_ASSETS) {
            if (baseAsset !== quoteAsset) {
                symbols.push(`${baseAsset}${quoteAsset}`);
            }
        }
    }

    return symbols;
};
const CONVERT_TRADE_FLOW_URL = `${BASE_URL}/sapi/v1/convert/tradeFlow`;
const EARN_POSITION_URL = `${BASE_URL}/sapi/v1/simple-earn/flexible/position`;
const LOCKED_EARN_POSITION_URL = `${BASE_URL}/sapi/v1/simple-earn/locked/position`;
const EARN_REWARDS_URL = `${BASE_URL}/sapi/v1/simple-earn/flexible/history/rewardsRecord`;
const FIAT_DEPOSIT_TRANSACTION_TYPE = '0';
const FIRST_PAGE = '1';
const C2C_BUY_TRADE_TYPE = 'BUY';
const C2C_UNAUTHORIZED_STATUS = 401;
const FIRST_OFFSET = 0;

const WEIGHT_HEADERS = {
    'x-mbx-used-weight-1m': '10',
    'x-sapi-used-ip-weight-1m': '20',
    'x-sapi-used-uid-weight-1m': '100'
};

export interface TimeWindow {
    readonly startMs: number;
    readonly endMs: number;
}

const parseTimeWindow = (url: URL, startParam: string, endParam: string): TimeWindow => {
    const startValue = url.searchParams.get(startParam);
    const endValue = url.searchParams.get(endParam);

    return {
        startMs: startValue === null ? Number.NEGATIVE_INFINITY : Number(startValue),
        endMs: endValue === null ? Number.POSITIVE_INFINITY : Number(endValue)
    };
};

const isWithinWindow = (timeMs: number, window: TimeWindow): boolean => timeMs >= window.startMs && timeMs <= window.endMs;

const buildPagedEarnResponse = <TRow>(url: URL, rows: TRow[]): { rows: TRow[]; total: number } => {
    const isFirstPage = url.searchParams.get('current') === FIRST_PAGE;
    const pageRows = isFirstPage ? rows : [];

    return { rows: pageRows, total: pageRows.length };
};

const sliceOffsetPage = <TRow>(url: URL, rows: TRow[]): TRow[] => {
    const offset = Number(url.searchParams.get('offset') ?? String(FIRST_OFFSET));
    const limit = Number(url.searchParams.get('limit') ?? String(rows.length));

    return rows.slice(offset, offset + limit);
};

export const binanceStub = {
    serverTime: (): void => {
        mockServer.use(http.get(SERVER_TIME_URL, () => HttpResponse.json({ serverTime: Date.now() }, { headers: WEIGHT_HEADERS })));
    },
    spotBalances: (balances: BinanceAssetBalanceApiInterface[]): void => {
        mockServer.use(http.post(SPOT_BALANCE_URL, () => HttpResponse.json(balances, { headers: WEIGHT_HEADERS })));
    },
    fundingBalances: (balances: BinanceAssetBalanceApiInterface[]): void => {
        mockServer.use(http.post(FUNDING_BALANCE_URL, () => HttpResponse.json(balances, { headers: WEIGHT_HEADERS })));
    },
    deposits: (deposits: BinanceDepositApiInterface[]): void => {
        mockServer.use(
            http.get(DEPOSIT_URL, ({ request }) => {
                const url = new URL(request.url);
                const window = parseTimeWindow(url, 'startTime', 'endTime');
                const matched = deposits.filter(deposit => isWithinWindow(deposit.insertTime, window));

                return HttpResponse.json(sliceOffsetPage(url, matched), { headers: WEIGHT_HEADERS });
            })
        );
    },
    withdrawals: (withdrawals: BinanceWithdrawalApiInterface[]): void => {
        mockServer.use(
            http.get(WITHDRAW_URL, ({ request }) => {
                const url = new URL(request.url);
                const window = parseTimeWindow(url, 'startTime', 'endTime');
                const matched = withdrawals.filter(withdrawal => isWithinWindow(new Date(withdrawal.applyTime).getTime(), window));

                return HttpResponse.json(sliceOffsetPage(url, matched), { headers: WEIGHT_HEADERS });
            })
        );
    },
    fiatOrders: (
        fiatDeposits: BinanceFiatOrderApiInterface[],
        fiatWithdrawals: BinanceFiatOrderApiInterface[],
        requestedWindows?: TimeWindow[],
        requestOrder?: string[]
    ): void => {
        mockServer.use(
            http.get(FIAT_ORDERS_URL, ({ request }) => {
                const url = new URL(request.url);
                const isDeposit = url.searchParams.get('transactionType') === FIAT_DEPOSIT_TRANSACTION_TYPE;
                const isFirstPage = url.searchParams.get('page') === FIRST_PAGE;
                const window = parseTimeWindow(url, 'beginTime', 'endTime');
                requestedWindows?.push(window);
                requestOrder?.push('fiat');
                const typeOrders = isDeposit ? fiatDeposits : fiatWithdrawals;
                const windowOrders = typeOrders.filter(order => isWithinWindow(order.createTime, window));
                const orders = isFirstPage ? windowOrders : [];

                return HttpResponse.json(
                    { code: '000000', message: 'success', data: orders, total: orders.length, success: true },
                    { headers: WEIGHT_HEADERS }
                );
            })
        );
    },
    c2cOrders: (
        buyOrders: BinanceC2cOrderApiInterface[],
        sellOrders: BinanceC2cOrderApiInterface[],
        requestedWindows?: TimeWindow[]
    ): void => {
        mockServer.use(
            http.get(C2C_ORDERS_URL, ({ request }) => {
                const url = new URL(request.url);
                const isBuy = url.searchParams.get('tradeType') === C2C_BUY_TRADE_TYPE;
                const isFirstPage = url.searchParams.get('page') === FIRST_PAGE;
                const window = parseTimeWindow(url, 'startTimestamp', 'endTimestamp');
                requestedWindows?.push(window);
                const typeOrders = isBuy ? buyOrders : sellOrders;
                const windowOrders = typeOrders.filter(order => isWithinWindow(order.createTime, window));
                const data = isFirstPage ? windowOrders : [];

                return HttpResponse.json(
                    { code: '000000', message: 'success', data, total: data.length, success: true },
                    { headers: WEIGHT_HEADERS }
                );
            })
        );
    },
    c2cUnavailable: (): void => {
        mockServer.use(
            http.get(C2C_ORDERS_URL, () =>
                HttpResponse.json(
                    { code: '-2015', msg: 'Invalid API-key, IP, or permissions for action.' },
                    { status: C2C_UNAUTHORIZED_STATUS }
                )
            )
        );
    },
    exchangeInfo: (symbols: string[]): void => {
        mockServer.use(
            http.get(EXCHANGE_INFO_URL, () =>
                HttpResponse.json({ symbols: symbols.map(symbol => ({ symbol, status: 'TRADING' })) }, { headers: WEIGHT_HEADERS })
            )
        );
    },
    exchangeInfoAllValid: (): void => {
        binanceStub.exchangeInfo(buildAllValidSymbols());
    },
    myTrades: (tradesBySymbol: Record<string, BinanceTradeApiInterface[]>, requestedSymbols?: Set<string>, requestedUrls?: URL[]): void => {
        mockServer.use(
            http.get(MY_TRADES_URL, ({ request }) => {
                const url = new URL(request.url);
                const symbol = url.searchParams.get('symbol') ?? '';
                const fromId = Number(url.searchParams.get('fromId') ?? '0');
                requestedSymbols?.add(symbol);
                requestedUrls?.push(url);
                const symbolTrades = tradesBySymbol[symbol] ?? [];
                const window = parseTimeWindow(url, 'startTime', 'endTime');
                const trades = fromId === 0 ? symbolTrades.filter(trade => isWithinWindow(trade.time, window)) : [];

                return HttpResponse.json(trades, { headers: WEIGHT_HEADERS });
            })
        );
    },
    myTradesFailure: (status: number, body: { readonly code: number; readonly msg: string }): void => {
        mockServer.use(http.get(MY_TRADES_URL, () => HttpResponse.json(body, { status, headers: WEIGHT_HEADERS })));
    },
    convertTradeFlow: (
        flows: BinanceConvertFlowApiInterface[],
        requestedWindows?: TimeWindow[],
        forceMoreData = false,
        requestOrder?: string[]
    ): void => {
        mockServer.use(
            http.get(CONVERT_TRADE_FLOW_URL, ({ request }) => {
                const url = new URL(request.url);
                const startTime = Number(url.searchParams.get('startTime') ?? '0');
                const endTime = Number(url.searchParams.get('endTime') ?? '0');
                const limit = Number(url.searchParams.get('limit') ?? '0');
                const window = { startMs: startTime, endMs: endTime };
                const matched = flows.filter(flow => isWithinWindow(flow.createTime, window));
                const hasMore = forceMoreData && matched.length > 1;
                requestedWindows?.push(window);
                requestOrder?.push('convert');

                return HttpResponse.json(
                    { list: hasMore ? matched.slice(0, 1) : matched, startTime, endTime, limit, moreData: hasMore },
                    { headers: WEIGHT_HEADERS }
                );
            })
        );
    },
    earnPositions: (positions: BinanceEarnPositionApiInterface[]): void => {
        mockServer.use(
            http.get(EARN_POSITION_URL, ({ request }) =>
                HttpResponse.json(buildPagedEarnResponse(new URL(request.url), positions), { headers: WEIGHT_HEADERS })
            )
        );
    },
    lockedEarnPositions: (positions: BinanceLockedEarnPositionApiInterface[]): void => {
        mockServer.use(
            http.get(LOCKED_EARN_POSITION_URL, ({ request }) =>
                HttpResponse.json(buildPagedEarnResponse(new URL(request.url), positions), { headers: WEIGHT_HEADERS })
            )
        );
    },
    earnRewards: (rewards: BinanceEarnRewardApiInterface[]): void => {
        mockServer.use(
            http.get(EARN_REWARDS_URL, ({ request }) => {
                const url = new URL(request.url);
                const isFirstPage = url.searchParams.get('current') === FIRST_PAGE;
                const window = parseTimeWindow(url, 'startTime', 'endTime');
                const windowRewards = rewards.filter(reward => isWithinWindow(reward.time, window));
                const rows = isFirstPage ? windowRewards : [];

                return HttpResponse.json({ rows, total: rows.length }, { headers: WEIGHT_HEADERS });
            })
        );
    }
};
