/* eslint-disable max-lines -- File owns a single multi-stage Binance signed-client pipeline (balances, crypto + fiat history, HMAC signing, weight throttle) that must stay together */
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import { subMonths } from 'date-fns/subMonths';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BaseSyncProviderClient } from '../../core/client/base-sync-provider.client';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncDeferredError } from '../../core/error/sync-deferred.error';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';
import { SyncUnauthorizedError } from '../../core/error/sync-unauthorized.error';
import { BINANCE_API_BASE_URL } from '../constant/binance-api-base-url.constant';
import { BinanceCredentialsSchema } from '../constant/binance-credentials.schema';
import { BINANCE_DORMANCY_PERIOD_MS } from '../constant/binance-dormancy-period-ms.constant';
import { BINANCE_FIAT_MAX_PERIOD_MS } from '../constant/binance-fiat-max-period-ms.constant';
import { BINANCE_MAJOR_QUOTE_ASSETS } from '../constant/binance-major-quote-asset.constant';
import { BINANCE_MICRO_UNITS_PRECISION as MICRO_UNITS_PRECISION } from '../constant/binance-precision.constant';
import { BinanceWalletEnum } from '../enum/binance-wallet.enum';
import { BinanceAssetBalanceListApiSchema } from '../interface/binance-asset-balance-api.schema';
import { BinanceC2cOrderListApiSchema } from '../interface/binance-c2c-order-api.schema';
import { BinanceConvertTradeFlowApiSchema } from '../interface/binance-convert-api.schema';
import { BinanceDepositListApiSchema } from '../interface/binance-deposit-api.schema';
import { BinanceEarnPositionListApiSchema } from '../interface/binance-earn-position-api.schema';
import { BinanceEarnRewardListApiSchema } from '../interface/binance-earn-reward-api.schema';
import { BinanceExchangeInfoApiSchema } from '../interface/binance-exchange-info-api.schema';
import { BinanceFiatOrderListApiSchema } from '../interface/binance-fiat-order-api.schema';
import { BinanceLockedEarnPositionListApiSchema } from '../interface/binance-locked-earn-position-api.schema';
import { BinanceServerTimeApiSchema } from '../interface/binance-server-time-api.schema';
import { BinanceTradeListApiSchema } from '../interface/binance-trade-api.schema';
import { BinanceWithdrawalListApiSchema } from '../interface/binance-withdrawal-api.schema';
import { binanceMapper } from '../mapper/binance.mapper';
import { decodeBinanceAccountId, encodeBinanceAccountId } from '../util/binance-account-id.util';

import { BinanceWeightThrottle } from './binance-weight-throttle';

import type { SyncError } from '../../core/interface/sync-error.type';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceCredentialsInterface } from '../constant/binance-credentials.schema';
import type { BinanceTradeCursorMapInterface } from '../constant/binance-trade-cursor-map.schema';
import type { BinanceAccountIdInterface } from '../interface/binance-account-id.interface';
import type { BinanceAssetBalanceApiInterface } from '../interface/binance-asset-balance-api.schema';
import type { BinanceC2cOrderApiInterface } from '../interface/binance-c2c-order-api.schema';
import type { BinanceCapitalHistorySourceInterface } from '../interface/binance-capital-history-source.interface';
import type { BinanceConvertFlowApiInterface } from '../interface/binance-convert-api.schema';
import type { BinanceDepositApiInterface } from '../interface/binance-deposit-api.schema';
import type { BinanceEarnRewardApiInterface } from '../interface/binance-earn-reward-api.schema';
import type { BinanceFiatOrderApiInterface } from '../interface/binance-fiat-order-api.schema';
import type { BinanceTradeSymbolInterface } from '../interface/binance-trade-symbol.interface';
import type { BinanceTransactionSourcesInterface } from '../interface/binance-transaction-sources.interface';
import type { BinanceTransferInterface } from '../interface/binance-transfer.interface';
import type { BinanceWindowWalkConfigInterface } from '../interface/binance-window-walk-config.interface';
import type { BinanceWithdrawalApiInterface } from '../interface/binance-withdrawal-api.schema';
import type * as Headers from 'effect/http/Headers';
import type * as HttpClient from 'effect/http/HttpClient';
import type { HttpMethod } from 'effect/http/HttpMethod';

const SPOT_BALANCE_ENDPOINT = '/sapi/v3/asset/getUserAsset';
const FUNDING_BALANCE_ENDPOINT = '/sapi/v1/asset/get-funding-asset';
const DEPOSIT_HISTORY_ENDPOINT = '/sapi/v1/capital/deposit/hisrec';
const WITHDRAW_HISTORY_ENDPOINT = '/sapi/v1/capital/withdraw/history';
const FIAT_ORDERS_ENDPOINT = '/sapi/v1/fiat/orders';
const C2C_ORDERS_ENDPOINT = '/sapi/v1/c2c/orderMatch/listUserOrderHistory';
const CONVERT_TRADE_FLOW_ENDPOINT = '/sapi/v1/convert/tradeFlow';
const MY_TRADES_ENDPOINT = '/api/v3/myTrades';
const EARN_POSITION_ENDPOINT = '/sapi/v1/simple-earn/flexible/position';
const LOCKED_EARN_POSITION_ENDPOINT = '/sapi/v1/simple-earn/locked/position';
const EARN_REWARDS_ENDPOINT = '/sapi/v1/simple-earn/flexible/history/rewardsRecord';
const SERVER_TIME_ENDPOINT = '/api/v3/time';
const EXCHANGE_INFO_ENDPOINT = '/api/v3/exchangeInfo';
const EXCHANGE_INFO_TRADING_STATUS = 'TRADING';
const SIGNATURE_RECV_WINDOW_MS = 60000;
const MILLISECONDS_PER_SECOND = 1000;
const MAX_TRANSACTIONS_PER_WINDOW = 500;
const FIAT_ROWS_PER_PAGE = 500;
const FIAT_DEPOSIT_TRANSACTION_TYPE = 0;
const FIAT_WITHDRAW_TRANSACTION_TYPE = 1;
const FIAT_SUCCESSFUL_STATUS = 'Successful';
const C2C_BUY_TRADE_TYPE = 'BUY';
const C2C_SELL_TRADE_TYPE = 'SELL';
const C2C_COMPLETED_STATUS = 'COMPLETED';
const C2C_ROWS_PER_PAGE = 100;
const C2C_MAX_PERIOD_MS = 2592000000;
const CAPITAL_HISTORY_MAX_PERIOD_MS = 7776000000;
const CONVERT_MAX_PERIOD_MS = 2592000000;
const CONVERT_ROWS_PER_PAGE = 1000;
const CONVERT_SUCCESS_STATUS = 'SUCCESS';
const EARN_REWARD_MAX_PERIOD_MS = 2592000000;
const UNBOUNDED_DORMANCY_WINDOW_COUNT = Number.MAX_SAFE_INTEGER;
const EARN_REWARD_TYPE_ALL = 'ALL';
const EARN_PAGE_SIZE = 100;
const TRADES_PER_SYMBOL_LIMIT = 1000;
const BINANCE_INVALID_SYMBOL_CODE = -1121;

export class BinanceSignedClient extends BaseSyncProviderClient {
    private static readonly C2C_HISTORY_MONTHS = 6;
    private static readonly decodeCredentials = Schema.decodeUnknownOption(Schema.fromJsonString(BinanceCredentialsSchema));

    readonly getAccounts = Effect.fn('BinanceSignedClient.getAccounts')(function* (this: BinanceSignedClient) {
        const balanceByAsset = this.buildSpotBalanceMap(
            yield* this.signedRequest(BinanceAssetBalanceListApiSchema, SPOT_BALANCE_ENDPOINT, 'POST')
        );
        const earnPositions = yield* this.collectPages(current =>
            this.fetchEarnPage(BinanceEarnPositionListApiSchema, EARN_POSITION_ENDPOINT, { current, size: EARN_PAGE_SIZE })
        );
        for (const position of earnPositions) {
            this.foldEarnPositionAmount(balanceByAsset, position.asset, position.totalAmount);
        }

        const lockedEarnPositions = yield* this.collectPages(current =>
            this.fetchEarnPage(BinanceLockedEarnPositionListApiSchema, LOCKED_EARN_POSITION_ENDPOINT, { current, size: EARN_PAGE_SIZE })
        );
        for (const position of lockedEarnPositions) {
            this.foldEarnPositionAmount(balanceByAsset, position.asset, position.amount);
        }

        const fundingBalances = yield* this.signedRequest(BinanceAssetBalanceListApiSchema, FUNDING_BALANCE_ENDPOINT, 'POST');

        return [
            ...this.buildSpotAccounts(balanceByAsset),
            ...fundingBalances.map(balance => this.mapBalance(balance, BinanceWalletEnum.FUNDING)).filter(isDefined)
        ];
    });

    readonly getTransactions = Effect.fn('BinanceSignedClient.getTransactions')(function* (
        this: BinanceSignedClient,
        accountId: string,
        from: number,
        to?: number
    ) {
        const decoded = yield* this.decodeAccountId(accountId);
        const { startTimeMs, endTimeMs } = this.resolveSourceWindow(from, to);
        const isSpot = decoded.wallet === BinanceWalletEnum.SPOT;
        const c2cOrders = isSpot ? yield* this.fetchC2cOrders(startTimeMs, endTimeMs) : [];
        const earnRewards = isSpot ? yield* this.fetchEarnRewards(startTimeMs, endTimeMs) : [];
        const capitalSources = yield* this.fetchCapitalSources(decoded.wallet, startTimeMs, endTimeMs);
        const fiatSources = yield* this.fetchFiatSources(startTimeMs, endTimeMs);

        return this.buildTransactions(accountId, decoded.asset, {
            deposits: capitalSources.deposits,
            withdrawals: capitalSources.withdrawals,
            fiatDeposits: fiatSources.fiatDeposits,
            fiatWithdrawals: fiatSources.fiatWithdrawals,
            c2cOrders,
            earnRewards
        });
    });

    readonly getC2cTransactions = Effect.fn('BinanceSignedClient.getC2cTransactions')(function* (
        this: BinanceSignedClient,
        from: number,
        to?: number
    ) {
        const { startTimeMs, endTimeMs } = this.resolveSourceWindow(from, to);

        return this.buildSourceTransactions(
            BinanceWalletEnum.FUNDING,
            this.emptySources({ c2cOrders: yield* this.fetchC2cOrders(startTimeMs, endTimeMs) })
        );
    });

    readonly getEarnTransactions = Effect.fn('BinanceSignedClient.getEarnTransactions')(function* (
        this: BinanceSignedClient,
        from: number,
        to?: number
    ) {
        const { startTimeMs, endTimeMs } = this.resolveSourceWindow(from, to);

        return this.buildSourceTransactions(
            BinanceWalletEnum.SPOT,
            this.emptySources({ earnRewards: yield* this.fetchEarnRewards(startTimeMs, endTimeMs) })
        );
    });

    readonly getCapitalTransactions = Effect.fn('BinanceSignedClient.getCapitalTransactions')(function* (
        this: BinanceSignedClient,
        from: number,
        to?: number
    ) {
        const { startTimeMs, endTimeMs } = this.resolveSourceWindow(from, to);

        return this.buildSourceTransactions(
            BinanceWalletEnum.SPOT,
            yield* this.fetchCapitalSources(BinanceWalletEnum.SPOT, startTimeMs, endTimeMs)
        );
    });

    readonly getFiatTransactions = Effect.fn('BinanceSignedClient.getFiatTransactions')(function* (
        this: BinanceSignedClient,
        from: number,
        to?: number
    ) {
        const { startTimeMs, endTimeMs } = this.resolveSourceWindow(from, to);

        return this.buildSourceTransactions(BinanceWalletEnum.SPOT, yield* this.fetchFiatSources(startTimeMs, endTimeMs));
    });

    readonly getTransfers = Effect.fn('BinanceSignedClient.getTransfers')(
        // eslint-disable-next-line max-params -- Existing public API intentionally keeps positional arguments
        function* (
            this: BinanceSignedClient,
            accountId: string,
            from: number,
            to: number | null = null,
            eligibleSoldOffBaseAssets: readonly string[] = [],
            initialSymbolTradeCursors: BinanceTradeCursorMapInterface = {}
        ) {
            yield* this.decodeAccountId(accountId);
            const { startTimeMs, endTimeMs } = this.resolveSourceWindow(from, to);

            return yield* this.cached(
                this.transferCache,
                `${startTimeMs}-${endTimeMs}:${[...eligibleSoldOffBaseAssets].sort().join(',')}`,
                this.fetchTradesAndConverts(startTimeMs, endTimeMs, eligibleSoldOffBaseAssets, initialSymbolTradeCursors)
            );
        }
    );

    protected readonly provider = SyncProviderEnum.BINANCE;
    protected readonly baseUrl = BINANCE_API_BASE_URL;
    protected readonly headers: Record<string, string>;
    protected override readonly retryMethods: readonly HttpMethod[] = ['GET', 'POST'];
    private readonly credentials: Option.Option<BinanceCredentialsInterface>;
    private readonly throttle: BinanceWeightThrottle;

    private readonly depositSource: BinanceCapitalHistorySourceInterface<BinanceDepositApiInterface> = {
        endpoint: DEPOSIT_HISTORY_ENDPOINT,
        schema: BinanceDepositListApiSchema,
        cache: new Map()
    };

    private readonly withdrawalSource: BinanceCapitalHistorySourceInterface<BinanceWithdrawalApiInterface> = {
        endpoint: WITHDRAW_HISTORY_ENDPOINT,
        schema: BinanceWithdrawalListApiSchema,
        cache: new Map()
    };

    private readonly fiatOrderCache = new Map<string, readonly BinanceFiatOrderApiInterface[]>();
    private readonly c2cOrderCache = new Map<string, readonly BinanceC2cOrderApiInterface[]>();
    private readonly earnRewardCache = new Map<string, readonly BinanceEarnRewardApiInterface[]>();
    private readonly transferCache = new Map<string, BinanceTransferInterface[]>();
    private readonly runSymbolTradeCursors = new Map<string, number>();
    private c2cUnavailableThisRun = false;
    private readonly c2cHistoryFloorTimeMs = subMonths(new Date(), BinanceSignedClient.C2C_HISTORY_MONTHS).getTime();
    private serverTimeOffsetMs: number | undefined;
    private validSymbols: Set<string> | undefined;

    private readonly fetchCapitalSources = Effect.fn('BinanceSignedClient.fetchCapitalSources')(function* (
        this: BinanceSignedClient,
        wallet: BinanceWalletEnum,
        startTimeMs: number,
        endTimeMs: number
    ) {
        const deposits = yield* this.fetchCapitalHistory(this.depositSource, wallet, startTimeMs, endTimeMs);
        const withdrawals = yield* this.fetchCapitalHistory(this.withdrawalSource, wallet, startTimeMs, endTimeMs);

        return this.emptySources({ deposits, withdrawals });
    });

    private readonly fetchFiatSources = Effect.fn('BinanceSignedClient.fetchFiatSources')(function* (
        this: BinanceSignedClient,
        startTimeMs: number,
        endTimeMs: number
    ) {
        const fiatDeposits = yield* this.fetchFiatOrders(FIAT_DEPOSIT_TRANSACTION_TYPE, startTimeMs, endTimeMs);
        const fiatWithdrawals = yield* this.fetchFiatOrders(FIAT_WITHDRAW_TRANSACTION_TYPE, startTimeMs, endTimeMs);

        return this.emptySources({ fiatDeposits, fiatWithdrawals });
    });

    private readonly fetchConvertWindow: (
        startTimeMs: number,
        endTimeMs: number
    ) => Effect.Effect<BinanceConvertFlowApiInterface[], SyncError, HttpClient.HttpClient> = Effect.fn(
        'BinanceSignedClient.fetchConvertWindow'
    )(function* (this: BinanceSignedClient, startTimeMs: number, endTimeMs: number) {
        const chunk = yield* this.signedRequest(BinanceConvertTradeFlowApiSchema, CONVERT_TRADE_FLOW_ENDPOINT, 'GET', {
            startTime: startTimeMs,
            endTime: endTimeMs,
            limit: CONVERT_ROWS_PER_PAGE
        });

        if (!chunk.moreData || endTimeMs <= startTimeMs) {
            return [...chunk.list];
        }

        const midpointMs = Math.floor((startTimeMs + endTimeMs) / 2);
        const older = yield* this.fetchConvertWindow(startTimeMs, midpointMs);
        const newer = yield* this.fetchConvertWindow(midpointMs + 1, endTimeMs);

        return [...older, ...newer];
    });

    private readonly resolveValidSymbols = Effect.fn('BinanceSignedClient.resolveValidSymbols')(function* (this: BinanceSignedClient) {
        if (isDefined(this.validSymbols)) {
            return this.validSymbols;
        }

        yield* this.throttle.waitIfNeeded();
        const exchangeInfo = yield* this.fetchJson(BinanceExchangeInfoApiSchema, EXCHANGE_INFO_ENDPOINT).pipe(Effect.option);

        if (Option.isNone(exchangeInfo)) {
            return null;
        }

        this.validSymbols = new Set(
            exchangeInfo.value.symbols.filter(symbol => symbol.status === EXCHANGE_INFO_TRADING_STATUS).map(symbol => symbol.symbol)
        );

        return this.validSymbols;
    });

    private readonly resolveTimestamp = Effect.fn('BinanceSignedClient.resolveTimestamp')(function* (this: BinanceSignedClient) {
        if (!isDefined(this.serverTimeOffsetMs)) {
            const serverTime = yield* this.fetchJson(BinanceServerTimeApiSchema, SERVER_TIME_ENDPOINT).pipe(Effect.option);
            this.serverTimeOffsetMs = Option.isSome(serverTime) ? serverTime.value.serverTime - Date.now() : 0;
        }

        return Date.now() + this.serverTimeOffsetMs;
    });

    private readonly walkWindowsBackward = Effect.fnUntraced(function* <T>(
        config: BinanceWindowWalkConfigInterface,
        fetchOneWindow: (windowStartMs: number, windowEndMs: number) => Effect.Effect<readonly T[], SyncError, HttpClient.HttpClient>
    ): Effect.fn.Return<T[], SyncError, HttpClient.HttpClient> {
        const records: T[] = [];
        let windowEndMs = config.endTimeMs;
        let consecutiveEmptyWindows = 0;

        while (consecutiveEmptyWindows < config.dormancyWindowCount && windowEndMs > config.startTimeMs) {
            const windowStartMs = Math.max(config.startTimeMs, windowEndMs - config.periodMs);
            const windowRecords = yield* fetchOneWindow(windowStartMs, windowEndMs);
            records.push(...windowRecords);
            consecutiveEmptyWindows = isNotEmptyArray(windowRecords) ? 0 : consecutiveEmptyWindows + 1;
            windowEndMs = windowStartMs;
        }

        return records;
    });

    private readonly collectPages = Effect.fnUntraced(function* <T>(
        fetchPage: (
            page: number
        ) => Effect.Effect<{ readonly rows: readonly T[]; readonly hasMore: boolean }, SyncError, HttpClient.HttpClient>
    ): Effect.fn.Return<T[], SyncError, HttpClient.HttpClient> {
        let page = 1;
        let result = yield* fetchPage(page);
        const rows = [...result.rows];

        while (result.hasMore) {
            page += 1;
            result = yield* fetchPage(page);
            rows.push(...result.rows);
        }

        return rows;
    });

    constructor(
        token: string,
        private readonly deadlineAtMs = Number.POSITIVE_INFINITY
    ) {
        super();
        this.credentials = BinanceSignedClient.decodeCredentials(token);
        this.headers = {
            'X-MBX-APIKEY': Option.match(this.credentials, { onNone: () => '', onSome: ({ apiKey }) => apiKey }),
            'Content-Type': 'application/json'
        };
        this.throttle = new BinanceWeightThrottle(deadlineAtMs);
    }

    getSymbolTradeCursors(): BinanceTradeCursorMapInterface {
        return Object.fromEntries(this.runSymbolTradeCursors);
    }

    isC2cUnavailable(): boolean {
        return this.c2cUnavailableThisRun;
    }

    protected override onResponseHeaders(headers: Headers.Headers): void {
        this.throttle.recordHeaders(headers);
    }

    private fetchTradesAndConverts(
        startTimeMs: number,
        endTimeMs: number,
        eligibleSoldOffBaseAssets: readonly string[],
        initialSymbolTradeCursors: BinanceTradeCursorMapInterface
    ) {
        return Effect.gen({ self: this }, function* (this: BinanceSignedClient) {
            const convertFlows = yield* this.walkWindowsBackward(
                { startTimeMs, endTimeMs, periodMs: CONVERT_MAX_PERIOD_MS, dormancyWindowCount: UNBOUNDED_DORMANCY_WINDOW_COUNT },
                (windowStartMs, windowEndMs) => this.fetchConvertWindow(windowStartMs, windowEndMs)
            );
            const convertTransfers = convertFlows
                .filter(flow => flow.orderStatus === CONVERT_SUCCESS_STATUS)
                .map(flow => binanceMapper.mapConvertToTransfer(flow))
                .filter(isDefined);
            const symbols = yield* this.deriveTradeSymbols(startTimeMs, endTimeMs, convertTransfers, eligibleSoldOffBaseAssets);
            const byExternalId = new Map<string, BinanceTransferInterface>();

            for (const symbol of symbols) {
                const resumeFromId = initialSymbolTradeCursors[symbol.symbol];
                const symbolTransfers = yield* this.fetchSymbolTrades(
                    symbol,
                    startTimeMs,
                    endTimeMs,
                    isDefined(resumeFromId) ? resumeFromId + 1 : null
                );
                for (const transfer of symbolTransfers) {
                    byExternalId.set(transfer.externalId, transfer);
                }
            }

            for (const transfer of convertTransfers) {
                byExternalId.set(transfer.externalId, transfer);
            }

            return [...byExternalId.values()];
        });
    }

    private readonly recoverMissingPermission = (error: SyncUnauthorizedError) =>
        Effect.as(Effect.logWarning(`Binance history skipped: ${error.message}`), []);

    private deriveTradeSymbols(
        startTimeMs: number,
        endTimeMs: number,
        convertTransfers: BinanceTransferInterface[],
        eligibleSoldOffBaseAssets: readonly string[]
    ) {
        return Effect.gen({ self: this }, function* (this: BinanceSignedClient) {
            const balances = yield* this.signedRequest(BinanceAssetBalanceListApiSchema, SPOT_BALANCE_ENDPOINT, 'POST');
            const baseAssets = this.collectBaseAssets(balances, convertTransfers);
            const deposits = yield* this.fetchCapitalHistory(this.depositSource, BinanceWalletEnum.SPOT, startTimeMs, endTimeMs).pipe(
                Effect.catchTag('SyncUnauthorizedError', this.recoverMissingPermission)
            );
            const withdrawals = yield* this.fetchCapitalHistory(this.withdrawalSource, BinanceWalletEnum.SPOT, startTimeMs, endTimeMs).pipe(
                Effect.catchTag('SyncUnauthorizedError', this.recoverMissingPermission)
            );
            const c2cOrders = yield* this.fetchC2cOrders(startTimeMs, endTimeMs).pipe(
                Effect.catchTag('SyncUnauthorizedError', this.recoverMissingPermission)
            );
            [
                ...deposits.map(deposit => deposit.coin),
                ...withdrawals.map(withdrawal => withdrawal.coin),
                ...c2cOrders.map(order => order.asset)
            ].forEach(asset => baseAssets.add(asset));
            const validSymbols = yield* this.resolveValidSymbols();
            const candidates = this.buildTradeSymbolCandidates(baseAssets, validSymbols, new Set(eligibleSoldOffBaseAssets));

            return isDefined(validSymbols) ? candidates.filter(candidate => validSymbols.has(candidate.symbol)) : candidates;
        });
    }

    private fetchSymbolTrades(symbol: BinanceTradeSymbolInterface, startTimeMs: number, endTimeMs: number, initialFromId: number | null) {
        return Effect.gen({ self: this }, function* (this: BinanceSignedClient) {
            const transfers: BinanceTransferInterface[] = [];
            let fromId = initialFromId;

            do {
                const trades = yield* this.signedRequest(BinanceTradeListApiSchema, MY_TRADES_ENDPOINT, 'GET', {
                    symbol: symbol.symbol,
                    ...(isDefined(fromId) ? { fromId } : { startTime: startTimeMs }),
                    limit: TRADES_PER_SYMBOL_LIMIT
                }).pipe(
                    Effect.catchTag('SyncInvalidResponseError', error =>
                        Number(error.apiCode) === BINANCE_INVALID_SYMBOL_CODE ? Effect.succeed([]) : Effect.fail(error)
                    )
                );
                const lastTrade = trades.at(-1);

                transfers.push(
                    ...trades
                        .filter(trade => trade.time >= startTimeMs && trade.time <= endTimeMs)
                        .map(trade => binanceMapper.mapTradeToTransfer(trade, symbol.baseAsset, symbol.quoteAsset))
                        .filter(isDefined)
                );
                if (isDefined(lastTrade)) {
                    this.runSymbolTradeCursors.set(symbol.symbol, lastTrade.id);
                }
                fromId = trades.length === TRADES_PER_SYMBOL_LIMIT && isDefined(lastTrade) ? lastTrade.id + 1 : null;
            } while (isDefined(fromId));

            return transfers;
        });
    }

    private signedRequest<S extends Schema.ConstraintDecoder<unknown>>(
        schema: S,
        endpoint: string,
        method: HttpMethod,
        params: Record<string, string | number> = {}
    ): Effect.Effect<S['Type'], SyncError, HttpClient.HttpClient> {
        return Effect.gen({ self: this }, function* (this: BinanceSignedClient) {
            if (Date.now() >= this.deadlineAtMs) {
                return yield* new SyncDeferredError({ provider: this.provider, message: 'Sync deadline reached' });
            }

            const credentials = yield* Option.match(this.credentials, {
                onNone: () => Effect.fail(new SyncUnauthorizedError({ provider: this.provider, message: 'Invalid Binance credentials' })),
                onSome: Effect.succeed
            });

            yield* this.throttle.waitIfNeeded();
            const query = Object.entries({ ...params, recvWindow: SIGNATURE_RECV_WINDOW_MS, timestamp: yield* this.resolveTimestamp() })
                .map(([key, value]) => `${key}=${String(value)}`)
                .join('&');

            return yield* this.fetchJson(schema, `${endpoint}?${query}&signature=${this.sign(query, credentials.apiSecret)}`, method);
        });
    }

    private fetchCapitalHistory<T>(
        { cache, schema, endpoint }: BinanceCapitalHistorySourceInterface<T>,
        wallet: BinanceWalletEnum,
        startTimeMs: number,
        endTimeMs: number
    ): Effect.Effect<T[], SyncError, HttpClient.HttpClient> {
        return this.walkWindowsBackward(
            { startTimeMs, endTimeMs, periodMs: CAPITAL_HISTORY_MAX_PERIOD_MS, dormancyWindowCount: UNBOUNDED_DORMANCY_WINDOW_COUNT },
            (windowStartMs, windowEndMs) =>
                this.cached(
                    cache,
                    `${wallet}:${endpoint}:${windowStartMs}-${windowEndMs}`,
                    this.collectPages(page =>
                        this.signedRequest(schema, endpoint, 'GET', {
                            startTime: windowStartMs,
                            endTime: windowEndMs,
                            limit: MAX_TRANSACTIONS_PER_WINDOW,
                            offset: (page - 1) * MAX_TRANSACTIONS_PER_WINDOW
                        }).pipe(Effect.map(rows => ({ rows, hasMore: rows.length === MAX_TRANSACTIONS_PER_WINDOW })))
                    )
                )
        );
    }

    private fetchFiatOrders(transactionType: number, startTimeMs: number, endTimeMs: number) {
        return this.cached(
            this.fiatOrderCache,
            `${transactionType}:${FIAT_ORDERS_ENDPOINT}:${startTimeMs}-${endTimeMs}`,
            this.walkWindowsBackward(
                {
                    startTimeMs,
                    endTimeMs,
                    periodMs: BINANCE_FIAT_MAX_PERIOD_MS,
                    dormancyWindowCount: Math.max(1, Math.ceil(BINANCE_DORMANCY_PERIOD_MS / BINANCE_FIAT_MAX_PERIOD_MS))
                },
                (windowStartMs, windowEndMs) =>
                    this.collectPages(page =>
                        this.signedRequest(BinanceFiatOrderListApiSchema, FIAT_ORDERS_ENDPOINT, 'GET', {
                            transactionType,
                            beginTime: windowStartMs,
                            endTime: windowEndMs,
                            page,
                            rows: FIAT_ROWS_PER_PAGE
                        }).pipe(
                            Effect.map(response => ({
                                rows: response.data.filter(order => order.status === FIAT_SUCCESSFUL_STATUS),
                                hasMore: response.data.length === FIAT_ROWS_PER_PAGE
                            }))
                        )
                    )
            )
        );
    }

    private fetchC2cOrders(startTimeMs: number, endTimeMs: number) {
        const availableStartTimeMs = Math.max(startTimeMs, this.c2cHistoryFloorTimeMs);

        if (availableStartTimeMs >= endTimeMs) {
            return Effect.succeed<readonly BinanceC2cOrderApiInterface[]>([]);
        }

        return this.cached(
            this.c2cOrderCache,
            `${availableStartTimeMs}-${endTimeMs}`,
            Effect.forEach([C2C_BUY_TRADE_TYPE, C2C_SELL_TRADE_TYPE], tradeType =>
                this.walkWindowsBackward(
                    {
                        startTimeMs: availableStartTimeMs,
                        endTimeMs,
                        periodMs: C2C_MAX_PERIOD_MS,
                        dormancyWindowCount: UNBOUNDED_DORMANCY_WINDOW_COUNT
                    },
                    (windowStartMs, windowEndMs) =>
                        this.collectPages(page => this.fetchC2cOrderPage(tradeType, windowStartMs, windowEndMs, page))
                )
            ).pipe(Effect.map(ordersByType => ordersByType.flat()))
        );
    }

    private fetchC2cOrderPage(tradeType: string, startTimeMs: number, endTimeMs: number, page: number) {
        return this.signedRequest(BinanceC2cOrderListApiSchema, C2C_ORDERS_ENDPOINT, 'GET', {
            tradeType,
            startTimestamp: startTimeMs,
            endTimestamp: endTimeMs,
            page,
            rows: C2C_ROWS_PER_PAGE
        }).pipe(
            Effect.map(response => ({
                rows: response.data.filter(order => order.orderStatus === C2C_COMPLETED_STATUS),
                hasMore: response.data.length === C2C_ROWS_PER_PAGE
            })),
            Effect.catchTag('SyncUnauthorizedError', () =>
                Effect.sync(() => {
                    this.c2cUnavailableThisRun = true;

                    return { rows: [], hasMore: false };
                })
            )
        );
    }

    private fetchEarnRewards(startTimeMs: number, endTimeMs: number) {
        return this.cached(
            this.earnRewardCache,
            `${startTimeMs}-${endTimeMs}`,
            this.walkWindowsBackward(
                { startTimeMs, endTimeMs, periodMs: EARN_REWARD_MAX_PERIOD_MS, dormancyWindowCount: UNBOUNDED_DORMANCY_WINDOW_COUNT },
                (windowStartMs, windowEndMs) =>
                    this.collectPages(current =>
                        this.fetchEarnPage(BinanceEarnRewardListApiSchema, EARN_REWARDS_ENDPOINT, {
                            type: EARN_REWARD_TYPE_ALL,
                            startTime: windowStartMs,
                            endTime: windowEndMs,
                            current,
                            size: EARN_PAGE_SIZE
                        })
                    )
            )
        );
    }

    private fetchEarnPage<T>(
        schema: Schema.ConstraintDecoder<{ readonly rows: readonly T[] }>,
        endpoint: string,
        params: Record<string, string | number>
    ) {
        return this.signedRequest(schema, endpoint, 'GET', params).pipe(
            Effect.map(response => ({ rows: response.rows, hasMore: response.rows.length === EARN_PAGE_SIZE }))
        );
    }

    private cached<T, E, R>(cache: Map<string, T>, key: string, effect: Effect.Effect<T, E, R>): Effect.Effect<T, E, R> {
        return Effect.suspend(() => {
            const hit = cache.get(key);

            return isDefined(hit) ? Effect.succeed(hit) : Effect.tap(effect, value => Effect.sync(() => cache.set(key, value)));
        });
    }

    private decodeAccountId(accountId: string): Effect.Effect<BinanceAccountIdInterface, SyncInvalidResponseError> {
        const decoded = decodeBinanceAccountId(accountId);

        return isDefined(decoded)
            ? Effect.succeed(decoded)
            : Effect.fail(new SyncInvalidResponseError({ provider: this.provider, message: `Invalid Binance account id "${accountId}"` }));
    }

    private resolveSourceWindow(from: number, to?: number | null): { startTimeMs: number; endTimeMs: number } {
        const startTimeMs = from * MILLISECONDS_PER_SECOND;
        const endTimeMs = isDefined(to) ? to * MILLISECONDS_PER_SECOND : Date.now();

        return { startTimeMs, endTimeMs };
    }

    private emptySources(overrides: Partial<BinanceTransactionSourcesInterface>): BinanceTransactionSourcesInterface {
        return {
            deposits: [],
            withdrawals: [],
            fiatDeposits: [],
            fiatWithdrawals: [],
            c2cOrders: [],
            earnRewards: [],
            ...overrides
        };
    }

    private buildTransactions(accountId: string, asset: string, sources: BinanceTransactionSourcesInterface): SyncTransactionInterface[] {
        const depositTransactions = sources.deposits
            .filter(deposit => deposit.coin === asset)
            .map(deposit => binanceMapper.mapDepositToTransaction(deposit, accountId))
            .filter(isDefined);
        const withdrawalTransactions = sources.withdrawals
            .filter(withdrawal => withdrawal.coin === asset)
            .map(withdrawal => binanceMapper.mapWithdrawalToTransaction(withdrawal, accountId))
            .filter(isDefined);
        const fiatDepositTransactions = sources.fiatDeposits
            .filter(order => order.fiatCurrency === asset)
            .map(order => binanceMapper.mapFiatOrderToTransaction(order, accountId, true))
            .filter(isDefined);
        const fiatWithdrawalTransactions = sources.fiatWithdrawals
            .filter(order => order.fiatCurrency === asset)
            .map(order => binanceMapper.mapFiatOrderToTransaction(order, accountId, false))
            .filter(isDefined);
        const c2cTransactions = sources.c2cOrders
            .filter(order => order.asset === asset)
            .map(order => binanceMapper.mapC2cOrderToTransaction(order, accountId))
            .filter(isDefined);
        const assetEarnRewards = sources.earnRewards.filter(reward => reward.asset === asset);
        const earnRewardTransactions = binanceMapper.mapEarnRewardsToTransactions(asset, accountId, assetEarnRewards);

        return [
            ...depositTransactions,
            ...withdrawalTransactions,
            ...fiatDepositTransactions,
            ...fiatWithdrawalTransactions,
            ...c2cTransactions,
            ...earnRewardTransactions
        ].sort((left, right) => right.time - left.time);
    }

    private buildSourceTransactions(wallet: BinanceWalletEnum, sources: BinanceTransactionSourcesInterface): SyncTransactionInterface[] {
        const byId = new Map<string, SyncTransactionInterface>();
        const assets = new Set([
            ...sources.deposits.map(deposit => deposit.coin),
            ...sources.withdrawals.map(withdrawal => withdrawal.coin),
            ...sources.fiatDeposits.map(order => order.fiatCurrency),
            ...sources.fiatWithdrawals.map(order => order.fiatCurrency),
            ...sources.c2cOrders.map(order => order.asset),
            ...sources.earnRewards.map(reward => reward.asset)
        ]);

        for (const asset of assets) {
            for (const transaction of this.buildTransactions(encodeBinanceAccountId({ wallet, asset }), asset, sources)) {
                byId.set(transaction.id, transaction);
            }
        }

        return [...byId.values()];
    }

    private collectBaseAssets(
        balances: readonly BinanceAssetBalanceApiInterface[],
        convertTransfers: BinanceTransferInterface[]
    ): Set<string> {
        const baseAssets = new Set<string>();
        for (const balance of balances) {
            const total = this.computeRawTotalBalance(balance);
            if (isDefined(total) && total > 0) {
                baseAssets.add(balance.asset);
            }
        }

        for (const transfer of convertTransfers) {
            for (const decoded of [
                decodeBinanceAccountId(transfer.fromAssetAccountId),
                decodeBinanceAccountId(transfer.toAssetAccountId)
            ]) {
                if (isDefined(decoded)) {
                    baseAssets.add(decoded.asset);
                }
            }
        }

        return baseAssets;
    }

    private buildTradeSymbolCandidates(
        baseAssets: Set<string>,
        validSymbols: Set<string> | null,
        eligibleSoldOffBaseAssets: Set<string>
    ): BinanceTradeSymbolInterface[] {
        const symbolsById = new Map<string, BinanceTradeSymbolInterface>();
        for (const baseAsset of baseAssets) {
            for (const quoteAsset of BINANCE_MAJOR_QUOTE_ASSETS) {
                if (baseAsset !== quoteAsset) {
                    const symbol = `${baseAsset}${quoteAsset}`;
                    symbolsById.set(symbol, { symbol, baseAsset, quoteAsset });
                }
            }
        }

        for (const symbol of validSymbols ?? []) {
            const tradeSymbol = this.parseSelectedQuoteTradeSymbol(symbol, baseAssets, eligibleSoldOffBaseAssets);
            if (isDefined(tradeSymbol)) {
                symbolsById.set(tradeSymbol.symbol, tradeSymbol);
            }
        }

        return [...symbolsById.values()];
    }

    private parseSelectedQuoteTradeSymbol(
        symbol: string,
        baseAssets: Set<string>,
        eligibleSoldOffBaseAssets: Set<string>
    ): BinanceTradeSymbolInterface | null {
        for (const quoteAsset of BINANCE_MAJOR_QUOTE_ASSETS) {
            const isSelectedQuotePair = baseAssets.has(quoteAsset) && symbol.endsWith(quoteAsset) && symbol !== quoteAsset;
            if (isSelectedQuotePair) {
                const baseAsset = symbol.slice(0, -quoteAsset.length);
                const isSpotTradeable = isNotEmptyString(baseAsset) && eligibleSoldOffBaseAssets.has(baseAsset);

                return isSpotTradeable ? { symbol, baseAsset, quoteAsset } : null;
            }
        }

        return null;
    }

    private buildSpotBalanceMap(balances: readonly BinanceAssetBalanceApiInterface[]): Map<string, number | null> {
        const balanceByAsset = new Map<string, number | null>();
        for (const balance of balances) {
            const total = this.computeRawTotalBalance(balance);
            if (isDefined(total) && total > 0) {
                balanceByAsset.set(balance.asset, total * MICRO_UNITS_PRECISION > Number.MAX_SAFE_INTEGER ? null : total);
            } else if (!isDefined(total)) {
                balanceByAsset.set(balance.asset, null);
            }
        }

        return balanceByAsset;
    }

    private foldEarnPositionAmount(balanceByAsset: Map<string, number | null>, asset: string, rawAmount: string): void {
        const quantity = binanceMapper.parseBinanceAmount(rawAmount);
        if (!isDefined(quantity)) {
            balanceByAsset.set(asset, null);

            return;
        }

        const currentBalance = balanceByAsset.get(asset);
        if (quantity <= 0 || (!isDefined(currentBalance) && balanceByAsset.has(asset))) {
            return;
        }

        const nextBalance = (currentBalance ?? 0) + quantity;
        balanceByAsset.set(asset, nextBalance * MICRO_UNITS_PRECISION > Number.MAX_SAFE_INTEGER ? null : nextBalance);
    }

    private buildSpotAccounts(balanceByAsset: Map<string, number | null>) {
        return [...balanceByAsset].map(([asset, total]) =>
            isDefined(total)
                ? binanceMapper.mapBalanceToAccount(asset, BinanceWalletEnum.SPOT, total)
                : binanceMapper.mapUnrepresentableBalanceToAccount(asset, BinanceWalletEnum.SPOT)
        );
    }

    private computeRawTotalBalance(balance: BinanceAssetBalanceApiInterface): number | null {
        const free = binanceMapper.parseBinanceAmount(balance.free);
        const locked = binanceMapper.parseBinanceAmount(balance.locked);
        if (!isDefined(free) || !isDefined(locked)) {
            return null;
        }

        return free + locked;
    }

    private mapBalance(balance: BinanceAssetBalanceApiInterface, wallet: BinanceWalletEnum) {
        const totalBalance = this.computeRawTotalBalance(balance);

        if (isDefined(totalBalance) && totalBalance <= 0) {
            return null;
        }

        if (!isDefined(totalBalance) || totalBalance * MICRO_UNITS_PRECISION > Number.MAX_SAFE_INTEGER) {
            return binanceMapper.mapUnrepresentableBalanceToAccount(balance.asset, wallet);
        }

        return binanceMapper.mapBalanceToAccount(balance.asset, wallet, totalBalance);
    }

    private sign(query: string, apiSecret: string): string {
        return bytesToHex(hmac(sha256, utf8ToBytes(apiSecret), utf8ToBytes(query)));
    }
}
