import { HttpResponse, http } from 'msw';

import { isDefined, isString } from '@rnw-community/shared';

import { mockServer } from '../scenario/mock-server';

import { binanceErrorResponse } from './binance-error-response';

import type {
    BinanceApiRestrictionsApiInterface,
    BinanceAssetBalanceApiInterface,
    BinanceC2cOrderApiInterface,
    BinanceConvertFlowApiInterface,
    BinanceDepositApiInterface,
    BinanceDividendApiInterface,
    BinanceDustLogApiInterface,
    BinanceEarnPositionApiInterface,
    BinanceEarnRewardApiInterface,
    BinanceFiatOrderApiInterface,
    BinanceLockedEarnPositionApiInterface,
    BinanceLockedEarnRewardApiInterface,
    BinanceStakingRewardApiInterface,
    BinanceTradeApiInterface,
    BinanceUniversalTransferApiInterface,
    BinanceWithdrawalApiInterface
} from '@budgie/sync';
import type { JsonBodyType } from 'msw';

const BASE_URL = 'https://api.binance.com';
const SERVER_TIME_URL = `${BASE_URL}/api/v3/time`;
const ACCOUNT_URL = `${BASE_URL}/api/v3/account`;
const API_RESTRICTIONS_URL = `${BASE_URL}/sapi/v1/account/apiRestrictions`;
const SPOT_BALANCE_URL = `${BASE_URL}/sapi/v3/asset/getUserAsset`;
const FUNDING_BALANCE_URL = `${BASE_URL}/sapi/v1/asset/get-funding-asset`;
const DEPOSIT_URL = `${BASE_URL}/sapi/v1/capital/deposit/hisrec`;
const WITHDRAW_URL = `${BASE_URL}/sapi/v1/capital/withdraw/history`;
const FIAT_ORDERS_URL = `${BASE_URL}/sapi/v1/fiat/orders`;
const C2C_ORDERS_URL = `${BASE_URL}/sapi/v1/c2c/orderMatch/listUserOrderHistory`;
const MY_TRADES_URL = `${BASE_URL}/api/v3/myTrades`;
const EXCHANGE_INFO_URL = `${BASE_URL}/api/v3/exchangeInfo`;
const CONVERT_TRADE_FLOW_URL = `${BASE_URL}/sapi/v1/convert/tradeFlow`;
const EARN_POSITION_URL = `${BASE_URL}/sapi/v1/simple-earn/flexible/position`;
const LOCKED_EARN_POSITION_URL = `${BASE_URL}/sapi/v1/simple-earn/locked/position`;
const EARN_REWARDS_URL = `${BASE_URL}/sapi/v1/simple-earn/flexible/history/rewardsRecord`;
const LOCKED_EARN_REWARDS_URL = `${BASE_URL}/sapi/v1/simple-earn/locked/history/rewardsRecord`;
const ETH_STAKING_REWARDS_URL = `${BASE_URL}/sapi/v1/eth-staking/eth/history/rewardsHistory`;
const SOL_STAKING_REWARDS_URL = `${BASE_URL}/sapi/v1/sol-staking/sol/history/rewardsHistory`;
const DUST_LOG_URL = `${BASE_URL}/sapi/v1/asset/dribblet`;
const DIVIDEND_URL = `${BASE_URL}/sapi/v1/asset/assetDividend`;
const UNIVERSAL_TRANSFER_URL = `${BASE_URL}/sapi/v1/asset/transfer`;
const FAILABLE_ENDPOINT_URLS = {
    c2cOrders: C2C_ORDERS_URL,
    lockedEarnRewards: LOCKED_EARN_REWARDS_URL,
    ethStakingRewards: ETH_STAKING_REWARDS_URL,
    solStakingRewards: SOL_STAKING_REWARDS_URL,
    dividends: DIVIDEND_URL,
    dustLogs: DUST_LOG_URL,
    universalTransfers: UNIVERSAL_TRANSFER_URL
};
const EXCHANGE_INFO_BASE_ASSETS = ['ADA', 'BNB', 'BTC', 'ETH', 'EUR', 'PEPE', 'USDT'];
const EXCHANGE_INFO_QUOTE_ASSETS = ['USDT', 'FDUSD', 'BTC', 'BNB', 'BUSD'];
const EXCHANGE_INFO_TRADING_STATUS = 'TRADING';
const EXCHANGE_INFO_SUFFIX_QUOTE_ASSETS = [...EXCHANGE_INFO_QUOTE_ASSETS, 'USDC', 'EUR'];

const EARN_PAGING = { pageParam: 'current', sizeParam: 'size', defaultSize: 10, maxSize: 100 };
const FIAT_PAGING = { pageParam: 'page', sizeParam: 'rows', defaultSize: 100, maxSize: 500 };
const C2C_PAGING = { pageParam: 'page', sizeParam: 'rows', defaultSize: 10, maxSize: 100 };

const parseLimit = (url: URL, defaultLimit: number, maxLimit: number): number =>
    Math.min(Number(url.searchParams.get('limit') ?? String(defaultLimit)), maxLimit);

const slicePage = <TRow>(url: URL, rows: readonly TRow[], paging: typeof EARN_PAGING): TRow[] => {
    const page = Number(url.searchParams.get(paging.pageParam) ?? '1');
    const size = Math.min(Number(url.searchParams.get(paging.sizeParam) ?? String(paging.defaultSize)), paging.maxSize);

    return rows.slice((page - 1) * size, page * size);
};

interface ExchangeInfoSymbolStub {
    readonly baseAsset: string;
    readonly quoteAsset: string;
    readonly status?: string;
}

const splitSymbolBySuffix = (symbol: string): ExchangeInfoSymbolStub => {
    const quoteAsset = EXCHANGE_INFO_SUFFIX_QUOTE_ASSETS.find(quote => symbol.endsWith(quote)) ?? '';

    return { baseAsset: symbol.slice(0, symbol.length - quoteAsset.length), quoteAsset };
};

const toExchangeInfoSymbol = (entry: string | ExchangeInfoSymbolStub) => {
    const { baseAsset, quoteAsset, status = EXCHANGE_INFO_TRADING_STATUS } = isString(entry) ? splitSymbolBySuffix(entry) : entry;

    return { symbol: `${baseAsset}${quoteAsset}`, baseAsset, quoteAsset, status };
};

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

const FIAT_DEPOSIT_TRANSACTION_TYPE = '0';
const C2C_BUY_TRADE_TYPE = 'BUY';
const MY_TRADES_DEFAULT_LIMIT = 500;
const MY_TRADES_MAX_LIMIT = 1000;
const DIVIDEND_DEFAULT_LIMIT = 20;
const DIVIDEND_MAX_LIMIT = 500;
const DUST_MAX_ROWS = 100;

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

const parseApplyTimeMs = (applyTime: string): number => Date.parse(applyTime.includes('T') ? applyTime : `${applyTime.replace(' ', 'T')}Z`);

const isWithinWindow = (timeMs: number, window: TimeWindow): boolean => timeMs >= window.startMs && timeMs <= window.endMs;

const SERVER_ERROR_STATUS = 500;
const UNAUTHORIZED_STATUS = 401;
const API_KEY_HEADER = 'X-MBX-APIKEY';

interface ApiKeyAccountStub {
    readonly apiKey: string;
    readonly uid: number;
    readonly spotBalances: BinanceAssetBalanceApiInterface[];
}

const respondForApiKey =
    (accounts: readonly ApiKeyAccountStub[], respond: (account: ApiKeyAccountStub) => JsonBodyType) =>
    ({ request }: { readonly request: Request }): Response => {
        const account = accounts.find(candidate => candidate.apiKey === request.headers.get(API_KEY_HEADER));

        return isDefined(account)
            ? HttpResponse.json(respond(account), { headers: WEIGHT_HEADERS })
            : HttpResponse.json({ code: -2015, msg: 'Invalid API-key' }, { status: UNAUTHORIZED_STATUS });
    };

interface ServeOptions {
    readonly onServed?: () => void;
    readonly failTimes?: number;
}

const serveWith = (options: ServeOptions | undefined, respond: (info: { readonly request: Request }) => Response) => {
    let servedCount = 0;

    return (info: { readonly request: Request }): Response => {
        servedCount += 1;
        options?.onServed?.();

        return servedCount <= (options?.failTimes ?? 0) ? new HttpResponse(null, { status: SERVER_ERROR_STATUS }) : respond(info);
    };
};

interface WindowedStubConfig<TRow> {
    readonly url: string;
    readonly rows: readonly TRow[];
    readonly getTimeMs: (row: TRow) => number;
    readonly respond: (matched: TRow[], url: URL) => JsonBodyType;
    readonly windowParams?: readonly [string, string];
    readonly isSelected?: (row: TRow, url: URL) => boolean;
    readonly requestedWindows?: TimeWindow[];
    readonly options?: ServeOptions;
    readonly requestOrder?: { readonly list: string[]; readonly label: string };
}

const stubWindowed = <TRow>(config: WindowedStubConfig<TRow>): void => {
    const [startParam, endParam] = config.windowParams ?? ['startTime', 'endTime'];
    mockServer.use(
        http.get(
            config.url,
            serveWith(config.options, ({ request }) => {
                const url = new URL(request.url);
                const window = parseTimeWindow(url, startParam, endParam);
                config.requestedWindows?.push(window);
                config.requestOrder?.list.push(config.requestOrder.label);
                const matched = config.rows.filter(
                    row => (config.isSelected?.(row, url) ?? true) && isWithinWindow(config.getTimeMs(row), window)
                );

                return HttpResponse.json(config.respond(matched, url), { headers: WEIGHT_HEADERS });
            })
        )
    );
};

const respondEarnPage = <TRow>(matched: TRow[], url: URL) => ({ rows: slicePage(url, matched, EARN_PAGING), total: matched.length });

const respondEnvelopePage =
    (paging: typeof EARN_PAGING) =>
    <TRow>(matched: TRow[], url: URL) => ({
        code: '000000',
        message: 'success',
        data: slicePage(url, matched, paging),
        total: matched.length,
        success: true
    });

const respondOffsetPage = <TRow>(matched: TRow[], url: URL): TRow[] => {
    const offset = Number(url.searchParams.get('offset') ?? '0');
    const limit = Number(url.searchParams.get('limit') ?? String(matched.length));

    return matched.slice(offset, offset + limit);
};

const stubUntimedEarnPage = (url: string, rows: readonly unknown[]): void => {
    stubWindowed({ url, rows, getTimeMs: () => 0, respond: respondEarnPage });
};

const stubTimedEarnPage = (url: string, rows: readonly { readonly time: number }[]): void => {
    stubWindowed({ url, rows, getTimeMs: row => row.time, respond: respondEarnPage });
};

export const binanceStub = {
    serverTime: (offsetMs = 0): void => {
        mockServer.use(
            http.get(SERVER_TIME_URL, () => HttpResponse.json({ serverTime: Date.now() + offsetMs }, { headers: WEIGHT_HEADERS }))
        );
    },
    accountsByApiKey: (accounts: readonly ApiKeyAccountStub[]): void => {
        mockServer.use(
            http.get(
                ACCOUNT_URL,
                respondForApiKey(accounts, account => ({ uid: account.uid }))
            ),
            http.post(
                SPOT_BALANCE_URL,
                respondForApiKey(accounts, account => account.spotBalances)
            )
        );
    },
    apiRestrictionsBody: (body: JsonBodyType): void => {
        mockServer.use(http.get(API_RESTRICTIONS_URL, () => HttpResponse.json(body, { headers: WEIGHT_HEADERS })));
    },
    apiRestrictions: (restrictions: Partial<BinanceApiRestrictionsApiInterface> = {}): void => {
        binanceStub.apiRestrictionsBody({
            ipRestrict: false,
            createTime: 1_700_000_000_000,
            enableReading: true,
            enableWithdrawals: false,
            enableInternalTransfer: false,
            permitsUniversalTransfer: false,
            enableVanillaOptions: false,
            enablePortfolioMarginTrading: false,
            enableFutures: false,
            enableMargin: false,
            enableSpotAndMarginTrading: false,
            ...restrictions
        });
    },
    spotBalances: (balances: BinanceAssetBalanceApiInterface[], options?: ServeOptions): void => {
        mockServer.use(
            http.post(
                SPOT_BALANCE_URL,
                serveWith(options, () => HttpResponse.json(balances, { headers: WEIGHT_HEADERS }))
            )
        );
    },
    fundingBalances: (balances: BinanceAssetBalanceApiInterface[]): void => {
        mockServer.use(http.post(FUNDING_BALANCE_URL, () => HttpResponse.json(balances, { headers: WEIGHT_HEADERS })));
    },
    deposits: (deposits: BinanceDepositApiInterface[], requestedWindows?: TimeWindow[], options?: ServeOptions): void => {
        stubWindowed({
            url: DEPOSIT_URL,
            rows: deposits,
            getTimeMs: deposit => deposit.insertTime,
            respond: respondOffsetPage,
            requestedWindows,
            options
        });
    },
    withdrawals: (withdrawals: BinanceWithdrawalApiInterface[], requestedWindows?: TimeWindow[], options?: ServeOptions): void => {
        stubWindowed({
            url: WITHDRAW_URL,
            rows: withdrawals,
            getTimeMs: withdrawal => parseApplyTimeMs(withdrawal.applyTime),
            respond: respondOffsetPage,
            requestedWindows,
            options
        });
    },
    fiatOrders: (
        fiatDeposits: BinanceFiatOrderApiInterface[],
        fiatWithdrawals: BinanceFiatOrderApiInterface[],
        requestedWindows?: TimeWindow[],
        requestOrder?: string[],
        options?: ServeOptions
    ): void => {
        stubWindowed({
            url: FIAT_ORDERS_URL,
            rows: [...fiatDeposits, ...fiatWithdrawals],
            getTimeMs: order => order.createTime,
            windowParams: ['beginTime', 'endTime'],
            isSelected: (order, url) =>
                (url.searchParams.get('transactionType') === FIAT_DEPOSIT_TRANSACTION_TYPE) === fiatDeposits.includes(order),
            respond: respondEnvelopePage(FIAT_PAGING),
            requestedWindows,
            ...(isDefined(requestOrder) && { requestOrder: { list: requestOrder, label: 'fiat' } }),
            options
        });
    },
    c2cOrders: (
        buyOrders: BinanceC2cOrderApiInterface[],
        sellOrders: BinanceC2cOrderApiInterface[],
        requestedWindows?: TimeWindow[]
    ): void => {
        stubWindowed({
            url: C2C_ORDERS_URL,
            rows: [...buyOrders, ...sellOrders],
            getTimeMs: order => order.createTime,
            windowParams: ['startTimestamp', 'endTimestamp'],
            isSelected: (order, url) => (url.searchParams.get('tradeType') === C2C_BUY_TRADE_TYPE) === buyOrders.includes(order),
            respond: respondEnvelopePage(C2C_PAGING),
            requestedWindows
        });
    },
    failEndpoint: (endpoint: keyof typeof FAILABLE_ENDPOINT_URLS, respond: () => Response): void => {
        mockServer.use(http.get(FAILABLE_ENDPOINT_URLS[endpoint], respond));
    },
    c2cUnavailable: (): void => {
        binanceStub.failEndpoint('c2cOrders', () =>
            binanceErrorResponse.unauthorized(-2015, 'Invalid API-key, IP, or permissions for action.')
        );
    },
    exchangeInfo: (symbols: readonly (string | ExchangeInfoSymbolStub)[]): void => {
        mockServer.use(
            http.get(EXCHANGE_INFO_URL, () =>
                HttpResponse.json({ symbols: symbols.map(toExchangeInfoSymbol) }, { headers: WEIGHT_HEADERS })
            )
        );
    },
    exchangeInfoAllValid: (): void => {
        binanceStub.exchangeInfo(buildAllValidSymbols());
    },
    myTrades: (
        tradesBySymbol: Record<string, BinanceTradeApiInterface[]>,
        requestedSymbols?: Set<string>,
        requestedUrls?: URL[],
        options?: ServeOptions
    ): void => {
        mockServer.use(
            http.get(
                MY_TRADES_URL,
                serveWith(options, ({ request }) => {
                    const url = new URL(request.url);
                    const symbol = url.searchParams.get('symbol') ?? '';
                    const fromId = url.searchParams.get('fromId');
                    requestedSymbols?.add(symbol);
                    requestedUrls?.push(url);
                    const symbolTrades = tradesBySymbol[symbol] ?? [];
                    const window = parseTimeWindow(url, 'startTime', 'endTime');
                    const matchedTrades =
                        fromId === null
                            ? symbolTrades.filter(trade => isWithinWindow(trade.time, window))
                            : symbolTrades.filter(trade => trade.id >= Number(fromId));

                    return HttpResponse.json(matchedTrades.slice(0, parseLimit(url, MY_TRADES_DEFAULT_LIMIT, MY_TRADES_MAX_LIMIT)), {
                        headers: WEIGHT_HEADERS
                    });
                })
            )
        );
    },
    myTradesFailure: (status: number, body: { readonly code: number; readonly msg: string }): void => {
        mockServer.use(http.get(MY_TRADES_URL, () => HttpResponse.json(body, { status, headers: WEIGHT_HEADERS })));
    },
    convertTradeFlow: (
        flows: BinanceConvertFlowApiInterface[],
        requestedWindows?: TimeWindow[],
        forceMoreData = false,
        requestOrder?: string[],
        options?: ServeOptions
    ): void => {
        mockServer.use(
            http.get(
                CONVERT_TRADE_FLOW_URL,
                serveWith(options, ({ request }) => {
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
            )
        );
    },
    universalTransfers: (transfers: BinanceUniversalTransferApiInterface[], requestedWindows?: TimeWindow[]): void => {
        stubWindowed({
            url: UNIVERSAL_TRANSFER_URL,
            rows: transfers,
            getTimeMs: transfer => transfer.timestamp,
            isSelected: (transfer, url) => transfer.type === url.searchParams.get('type'),
            respond: respondEarnPage,
            requestedWindows
        });
    },
    earnPositions: (positions: BinanceEarnPositionApiInterface[]): void => {
        stubUntimedEarnPage(EARN_POSITION_URL, positions);
    },
    lockedEarnPositions: (positions: BinanceLockedEarnPositionApiInterface[]): void => {
        stubUntimedEarnPage(LOCKED_EARN_POSITION_URL, positions);
    },
    earnRewards: (rewards: BinanceEarnRewardApiInterface[], requestedWindows?: TimeWindow[], options?: ServeOptions): void => {
        stubWindowed({
            url: EARN_REWARDS_URL,
            rows: rewards,
            getTimeMs: reward => reward.time,
            respond: respondEarnPage,
            requestedWindows,
            options
        });
    },
    lockedEarnRewards: (rewards: BinanceLockedEarnRewardApiInterface[]): void => {
        stubTimedEarnPage(LOCKED_EARN_REWARDS_URL, rewards);
    },
    ethStakingRewards: (rewards: BinanceStakingRewardApiInterface[]): void => {
        stubTimedEarnPage(ETH_STAKING_REWARDS_URL, rewards);
    },
    solStakingRewards: (rewards: BinanceStakingRewardApiInterface[]): void => {
        stubTimedEarnPage(SOL_STAKING_REWARDS_URL, rewards);
    },
    dividends: (dividends: BinanceDividendApiInterface[]): void => {
        stubWindowed({
            url: DIVIDEND_URL,
            rows: dividends,
            getTimeMs: dividend => dividend.divTime,
            respond: (matched, url) => ({
                rows: matched.slice(0, parseLimit(url, DIVIDEND_DEFAULT_LIMIT, DIVIDEND_MAX_LIMIT)),
                total: matched.length
            })
        });
    },
    dustLogs: (dustLogs: BinanceDustLogApiInterface[]): void => {
        stubWindowed({
            url: DUST_LOG_URL,
            rows: dustLogs,
            getTimeMs: dustLog => dustLog.operateTime,
            respond: matched => ({ total: matched.length, userAssetDribblets: matched.slice(0, DUST_MAX_ROWS) })
        });
    }
};
