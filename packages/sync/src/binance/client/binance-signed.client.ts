/* eslint-disable max-lines -- File owns a single multi-stage Binance signed-client pipeline (balances, crypto + fiat history, HMAC signing, weight throttle) that must stay together */
import { PRECISION } from '@budgie/contracts';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { subDays } from 'date-fns/subDays';
import { subMonths } from 'date-fns/subMonths';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { BaseSyncProviderClient } from '../../core/client/base-sync-provider.client';
import {
    HTTP_STATUS_FORBIDDEN,
    HTTP_STATUS_IM_A_TEAPOT,
    HTTP_STATUS_TOO_MANY_REQUESTS,
    HTTP_STATUS_UNAVAILABLE_FOR_LEGAL_REASONS
} from '../../core/constant/http-status.constant';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncDeferredError } from '../../core/error/sync-deferred.error';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';
import { SyncRateLimitedError } from '../../core/error/sync-rate-limited.error';
import { SyncRegionUnavailableError } from '../../core/error/sync-region-unavailable.error';
import { SyncUnauthorizedError } from '../../core/error/sync-unauthorized.error';
import { BinanceCredentialsSchema } from '../constant/binance-credentials.schema';
import { BinanceCapitalOutcomeEnum } from '../enum/binance-capital-outcome.enum';
import { BinanceWalletEnum } from '../enum/binance-wallet.enum';
import { BinanceKeyPermissionsError } from '../error/binance-key-permissions.error';
import { BinanceAccountApiSchema } from '../interface/binance-account-api.schema';
import { BinanceApiRestrictionsApiSchema } from '../interface/binance-api-restrictions-api.schema';
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
import { BinanceUniversalTransferListApiSchema } from '../interface/binance-universal-transfer-api.schema';
import { BinanceWithdrawalListApiSchema } from '../interface/binance-withdrawal-api.schema';
import {
    buildBinanceDepositExternalId,
    getBinanceCapitalWallet,
    getBinanceDepositOutcome,
    getBinanceWithdrawalOutcome,
    mapBinanceBalanceToAccount,
    mapBinanceC2cOrderToTransaction,
    mapBinanceConvertToTransfer,
    mapBinanceDepositToTransaction,
    mapBinanceEarnRewardsToTransactions,
    mapBinanceFiatOrderToTransaction,
    mapBinanceTradeToTransfer,
    mapBinanceUniversalTransferToTransfer,
    mapBinanceUnrepresentableBalanceToAccount,
    mapBinanceWithdrawalToTransaction,
    parseBinanceAmount
} from '../mapper/binance.mapper';
import { decodeBinanceAccountId, encodeBinanceAccountId } from '../utils/binance-account-id.util';

import { BinanceWeightThrottle } from './binance-weight-throttle';

import type { SyncError } from '../../core/interface/sync-error.type';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceCredentialsInterface } from '../constant/binance-credentials.schema';
import type { BinanceTradeCursorMapInterface } from '../constant/binance-trade-cursor-map.schema';
import type { BinanceAccountIdInterface } from '../interface/binance-account-id.interface';
import type { BinanceApiRestrictionsApiInterface } from '../interface/binance-api-restrictions-api.schema';
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

const API_BASE_URL = 'https://api.binance.com';
const DORMANCY_PERIOD_MS = 7_776_000_000;
const FIAT_MAX_PERIOD_MS = 2592000000;
const MAJOR_QUOTE_ASSETS: readonly string[] = ['USDT', 'FDUSD', 'BTC', 'BNB', 'BUSD'];
const SPOT_BALANCE_ENDPOINT = '/sapi/v3/asset/getUserAsset';
const FUNDING_BALANCE_ENDPOINT = '/sapi/v1/asset/get-funding-asset';
const DEPOSIT_HISTORY_ENDPOINT = '/sapi/v1/capital/deposit/hisrec';
const WITHDRAW_HISTORY_ENDPOINT = '/sapi/v1/capital/withdraw/history';
const FIAT_ORDERS_ENDPOINT = '/sapi/v1/fiat/orders';
const C2C_ORDERS_ENDPOINT = '/sapi/v1/c2c/orderMatch/listUserOrderHistory';
const CONVERT_TRADE_FLOW_ENDPOINT = '/sapi/v1/convert/tradeFlow';
const MY_TRADES_ENDPOINT = '/api/v3/myTrades';
const UNIVERSAL_TRANSFER_ENDPOINT = '/sapi/v1/asset/transfer';
const UNIVERSAL_TRANSFER_TYPES = ['MAIN_FUNDING', 'FUNDING_MAIN'];
const UNIVERSAL_TRANSFER_CONFIRMED_STATUS = 'CONFIRMED';
const UNIVERSAL_TRANSFER_MAX_PERIOD_MS = 2592000000;
const EARN_POSITION_ENDPOINT = '/sapi/v1/simple-earn/flexible/position';
const LOCKED_EARN_POSITION_ENDPOINT = '/sapi/v1/simple-earn/locked/position';
const EARN_REWARDS_ENDPOINT = '/sapi/v1/simple-earn/flexible/history/rewardsRecord';
const API_RESTRICTIONS_ENDPOINT = '/sapi/v1/account/apiRestrictions';
const ACCOUNT_ENDPOINT = '/api/v3/account';
const SERVER_TIME_ENDPOINT = '/api/v3/time';
const EXCHANGE_INFO_ENDPOINT = '/api/v3/exchangeInfo';
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
const BINANCE_TIMESTAMP_OUTSIDE_WINDOW_CODE = -1021;
const BINANCE_REJECTED_MBX_KEY_CODE = -2015;
const BINANCE_INVALID_API_KEY_FORMAT_CODE = -2014;
const BINANCE_INVALID_SIGNATURE_CODE = -1022;
const BINANCE_INVALID_API_KEY_ID_CODE = -2008;
const BINANCE_AUTH_ERROR_CODES = new Set([
    BINANCE_REJECTED_MBX_KEY_CODE,
    BINANCE_INVALID_API_KEY_FORMAT_CODE,
    BINANCE_INVALID_SIGNATURE_CODE,
    BINANCE_INVALID_API_KEY_ID_CODE
]);
const BINANCE_BLOCK_BACKOFF_MS = 120_000;
const RETRY_AFTER_HEADER = 'retry-after';

export class BinanceSignedClient extends BaseSyncProviderClient {
    private static readonly LIMITED_HISTORY_MONTHS = 6;
    private static readonly CAPITAL_PENDING_MAX_AGE_DAYS = 180;

    private static readonly FORBIDDEN_KEY_PERMISSIONS = [
        'enableSpotAndMarginTrading',
        'enableWithdrawals',
        'enableInternalTransfer',
        'permitsUniversalTransfer',
        'enableMargin',
        'enableFutures',
        'enableVanillaOptions',
        'enablePortfolioMarginTrading'
    ] as const satisfies readonly (keyof BinanceApiRestrictionsApiInterface)[];

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

    readonly getAccountUid = Effect.fn('BinanceSignedClient.getAccountUid')(function* (this: BinanceSignedClient) {
        const account = yield* this.signedRequest(BinanceAccountApiSchema, ACCOUNT_ENDPOINT, 'GET', { omitZeroBalances: 'true' });

        return String(account.uid);
    });

    readonly assertReadOnlyKey = Effect.fn('BinanceSignedClient.assertReadOnlyKey')(function* (this: BinanceSignedClient) {
        const restrictions = yield* this.signedRequest(BinanceApiRestrictionsApiSchema, API_RESTRICTIONS_ENDPOINT, 'GET').pipe(
            Effect.catchTag('SyncInvalidResponseError', () =>
                Effect.fail(
                    new BinanceKeyPermissionsError({ permissions: [], message: 'Could not verify the Binance API key permissions' })
                )
            )
        );
        const permissions = BinanceSignedClient.FORBIDDEN_KEY_PERMISSIONS.filter(permission => restrictions[permission] === true);
        if (isNotEmptyArray(permissions)) {
            return yield* new BinanceKeyPermissionsError({
                permissions,
                message: `Binance API key must be read-only, but has: ${permissions.join(', ')}`
            });
        }
    });

    readonly getC2cTransactions = Effect.fn('BinanceSignedClient.getC2cTransactions')(function* (
        this: BinanceSignedClient,
        from: number,
        to?: number
    ) {
        return yield* this.getSourceTransactions(BinanceWalletEnum.FUNDING, from, to, (startTimeMs, endTimeMs) =>
            Effect.map(this.fetchC2cOrders(startTimeMs, endTimeMs), c2cOrders => this.emptySources({ c2cOrders }))
        );
    });

    readonly getEarnTransactions = Effect.fn('BinanceSignedClient.getEarnTransactions')(function* (
        this: BinanceSignedClient,
        from: number,
        to?: number
    ) {
        return yield* this.getSourceTransactions(BinanceWalletEnum.SPOT, from, to, (startTimeMs, endTimeMs) =>
            Effect.map(this.fetchEarnRewards(startTimeMs, endTimeMs), earnRewards => this.emptySources({ earnRewards }))
        );
    });

    readonly getCapitalTransactions = Effect.fn('BinanceSignedClient.getCapitalTransactions')(function* (
        this: BinanceSignedClient,
        from: number,
        to?: number
    ) {
        return yield* this.getSourceTransactions(BinanceWalletEnum.SPOT, from, to, (startTimeMs, endTimeMs) =>
            this.fetchCapitalSources(BinanceWalletEnum.SPOT, startTimeMs, endTimeMs)
        );
    });

    readonly getFiatTransactions = Effect.fn('BinanceSignedClient.getFiatTransactions')(function* (
        this: BinanceSignedClient,
        from: number,
        to?: number
    ) {
        return yield* this.getSourceTransactions(BinanceWalletEnum.SPOT, from, to, (startTimeMs, endTimeMs) =>
            this.fetchFiatSources(startTimeMs, endTimeMs)
        );
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
            const { startTimeMs, endTimeMs } = yield* this.resolveSourceWindow(from, to);

            return yield* this.cached(
                this.transferCache,
                `${startTimeMs}-${endTimeMs}:${[...eligibleSoldOffBaseAssets].sort().join(',')}`,
                this.fetchTradesAndConverts(startTimeMs, endTimeMs, eligibleSoldOffBaseAssets, initialSymbolTradeCursors)
            );
        }
    );

    protected readonly provider = SyncProviderEnum.BINANCE;
    protected readonly baseUrl = API_BASE_URL;
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
    private readonly runTouchedAssets = new Set<string>();
    private readonly rejectedCapitalExternalIds = new Set<string>();
    private capitalPendingFromMs: number | null = null;
    private c2cUnavailableThisRun = false;
    private readonly limitedHistoryFloorTimeMs = subMonths(new Date(), BinanceSignedClient.LIMITED_HISTORY_MONTHS).getTime();
    private readonly capitalPendingFloorTimeMs = subDays(new Date(), BinanceSignedClient.CAPITAL_PENDING_MAX_AGE_DAYS).getTime();
    private serverTimeOffsetMs: number | null = null;
    private runEndTimeMs: number | undefined;
    private exchangeSymbols: readonly BinanceTradeSymbolInterface[] | undefined;

    private readonly fetchCapitalSources = Effect.fn('BinanceSignedClient.fetchCapitalSources')(function* (
        this: BinanceSignedClient,
        wallet: BinanceWalletEnum,
        startTimeMs: number,
        endTimeMs: number
    ) {
        const deposits = yield* this.fetchCapitalHistory(this.depositSource, wallet, startTimeMs, endTimeMs);
        const withdrawals = yield* this.fetchCapitalHistory(this.withdrawalSource, wallet, startTimeMs, endTimeMs);

        return this.emptySources({
            deposits: deposits.filter(deposit =>
                this.recordCapitalOutcome(buildBinanceDepositExternalId(deposit), deposit.insertTime, getBinanceDepositOutcome(deposit))
            ),
            withdrawals: withdrawals.filter(withdrawal =>
                this.recordCapitalOutcome(withdrawal.id, new Date(withdrawal.applyTime).getTime(), getBinanceWithdrawalOutcome(withdrawal))
            )
        });
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

    private readonly resolveExchangeSymbols = Effect.fn('BinanceSignedClient.resolveExchangeSymbols')(function* (
        this: BinanceSignedClient
    ) {
        if (isDefined(this.exchangeSymbols)) {
            return this.exchangeSymbols;
        }

        yield* this.throttle.waitIfNeeded();
        const exchangeInfo = yield* this.fetchJson(BinanceExchangeInfoApiSchema, EXCHANGE_INFO_ENDPOINT).pipe(Effect.option);

        if (Option.isNone(exchangeInfo)) {
            return null;
        }

        this.exchangeSymbols = exchangeInfo.value.symbols;

        return this.exchangeSymbols;
    });

    private readonly resolveTimestamp = Effect.fn('BinanceSignedClient.resolveTimestamp')(function* (this: BinanceSignedClient) {
        if (!isDefined(this.serverTimeOffsetMs)) {
            const serverTime = yield* this.fetchJson(BinanceServerTimeApiSchema, SERVER_TIME_ENDPOINT).pipe(Effect.option);
            const now = yield* Clock.currentTimeMillis;

            if (Option.isNone(serverTime)) {
                return now;
            }

            this.serverTimeOffsetMs = serverTime.value.serverTime - now;
        }

        return (yield* Clock.currentTimeMillis) + this.serverTimeOffsetMs;
    });

    private readonly resolveSourceWindow = Effect.fn('BinanceSignedClient.resolveSourceWindow')(function* (
        this: BinanceSignedClient,
        from: number,
        to?: number | null
    ) {
        const startTimeMs = from * MILLISECONDS_PER_SECOND;

        if (isDefined(to)) {
            return { startTimeMs, endTimeMs: to * MILLISECONDS_PER_SECOND };
        }

        if (!isDefined(this.runEndTimeMs)) {
            this.runEndTimeMs = yield* this.resolveTimestamp();
        }

        return { startTimeMs, endTimeMs: this.runEndTimeMs };
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
        private readonly deadlineAtMs = Number.POSITIVE_INFINITY,
        private readonly isFiatDiscoveryEnabled = true
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

    getCapitalPendingFromMs(): number | null {
        return this.capitalPendingFromMs;
    }

    getRejectedCapitalExternalIds(): ReadonlySet<string> {
        return this.rejectedCapitalExternalIds;
    }

    protected override onResponseHeaders(headers: Headers.Headers): void {
        this.throttle.recordHeaders(headers);
    }

    protected override fetchJson<S extends Schema.ConstraintDecoder<unknown>>(schema: S, endpoint: string, method: HttpMethod = 'GET') {
        return super.fetchJson(schema, endpoint, method).pipe(
            Effect.catchTag('SyncRateLimitedError', error => {
                const coolDown = isDefined(error.retryAfterMs) ? this.throttle.coolDownFor(error.retryAfterMs) : Effect.void;

                return coolDown.pipe(Effect.andThen(Effect.fail(error)));
            })
        );
    }

    protected override classifyApiError(
        status: number,
        message: string,
        apiCode: string | number | undefined,
        headers: Headers.Headers
    ): SyncError {
        const { provider } = this;

        if (BINANCE_AUTH_ERROR_CODES.has(Number(apiCode))) {
            return new SyncUnauthorizedError({ provider, message });
        }

        switch (status) {
            case HTTP_STATUS_UNAVAILABLE_FOR_LEGAL_REASONS:
                return new SyncRegionUnavailableError({ provider, message });
            case HTTP_STATUS_FORBIDDEN:
            case HTTP_STATUS_IM_A_TEAPOT:
                return this.buildRateLimitedError(message, headers, BINANCE_BLOCK_BACKOFF_MS);
            case HTTP_STATUS_TOO_MANY_REQUESTS:
                return this.buildRateLimitedError(message, headers, null);
            default:
                return super.classifyApiError(status, message, apiCode, headers);
        }
    }

    private buildRateLimitedError(message: string, headers: Headers.Headers, fallbackRetryAfterMs: number | null): SyncRateLimitedError {
        const retryAfterSeconds = Number.parseInt(headers[RETRY_AFTER_HEADER] ?? '', 10);
        const retryAfterMs = Number.isNaN(retryAfterSeconds) ? fallbackRetryAfterMs : retryAfterSeconds * MILLISECONDS_PER_SECOND;

        return new SyncRateLimitedError({ provider: this.provider, message, ...(isDefined(retryAfterMs) && { retryAfterMs }) });
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
                .map(flow => mapBinanceConvertToTransfer(flow))
                .filter(isDefined);
            const universalTransfers = yield* this.fetchUniversalTransfers(startTimeMs, endTimeMs);
            const symbols = yield* this.deriveTradeSymbols(startTimeMs, endTimeMs, convertTransfers, eligibleSoldOffBaseAssets);
            const symbolFetches = yield* Effect.forEach(symbols, symbol => {
                const resumeFromId = initialSymbolTradeCursors[symbol.symbol];

                return this.fetchSymbolTrades(symbol, startTimeMs, endTimeMs, isDefined(resumeFromId) ? resumeFromId + 1 : null);
            });
            const byExternalId = new Map(
                [...symbolFetches.flatMap(({ transfers }) => transfers), ...convertTransfers, ...universalTransfers].map(transfer => [
                    transfer.externalId,
                    transfer
                ])
            );

            for (const { symbol, lastWindowTradeId } of symbolFetches) {
                if (isDefined(lastWindowTradeId)) {
                    this.runSymbolTradeCursors.set(symbol, lastWindowTradeId);
                }
            }

            return [...byExternalId.values()];
        });
    }

    private deriveTradeSymbols(
        startTimeMs: number,
        endTimeMs: number,
        convertTransfers: BinanceTransferInterface[],
        eligibleSoldOffBaseAssets: readonly string[]
    ) {
        return Effect.gen({ self: this }, function* (this: BinanceSignedClient) {
            const balances = yield* this.signedRequest(BinanceAssetBalanceListApiSchema, SPOT_BALANCE_ENDPOINT, 'POST');
            const { deposits, withdrawals } = yield* this.fetchCapitalSources(BinanceWalletEnum.SPOT, startTimeMs, endTimeMs);
            const c2cOrders = yield* this.fetchC2cOrders(startTimeMs, endTimeMs);
            const { fiatDeposits, fiatWithdrawals } = this.isFiatDiscoveryEnabled
                ? yield* this.fetchFiatSources(startTimeMs, endTimeMs)
                : this.emptySources({});
            [
                ...this.collectTouchedAssets(balances, convertTransfers),
                ...deposits.map(deposit => deposit.coin),
                ...withdrawals.map(withdrawal => withdrawal.coin),
                ...c2cOrders.map(order => order.asset),
                ...fiatDeposits.map(order => order.fiatCurrency),
                ...fiatWithdrawals.map(order => order.fiatCurrency)
            ].forEach(asset => this.runTouchedAssets.add(asset));
            const exchangeSymbols = yield* this.resolveExchangeSymbols();

            return this.buildTradeSymbolCandidates(this.runTouchedAssets, exchangeSymbols, new Set(eligibleSoldOffBaseAssets));
        });
    }

    private fetchSymbolTrades(symbol: BinanceTradeSymbolInterface, startTimeMs: number, endTimeMs: number, initialFromId: number | null) {
        return Effect.gen({ self: this }, function* (this: BinanceSignedClient) {
            const transfers: BinanceTransferInterface[] = [];
            let fromId = initialFromId;
            let lastWindowTradeId: number | null = null;

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
                const windowTrades = trades.filter(trade => trade.time >= startTimeMs && trade.time <= endTimeMs);
                const lastWindowTrade = windowTrades.at(-1);

                transfers.push(
                    ...windowTrades.map(trade => mapBinanceTradeToTransfer(trade, symbol.baseAsset, symbol.quoteAsset)).filter(isDefined)
                );
                lastWindowTradeId = lastWindowTrade?.id ?? lastWindowTradeId;
                fromId = trades.length === TRADES_PER_SYMBOL_LIMIT && isDefined(lastTrade) ? lastTrade.id + 1 : null;
            } while (isDefined(fromId));

            return { symbol: symbol.symbol, transfers, lastWindowTradeId };
        });
    }

    private signedRequest<S extends Schema.ConstraintDecoder<unknown>>(
        schema: S,
        endpoint: string,
        method: HttpMethod,
        params: Record<string, string | number> = {}
    ): Effect.Effect<S['Type'], SyncError, HttpClient.HttpClient> {
        return this.sendSignedRequest(schema, endpoint, method, params).pipe(
            Effect.catchTag('SyncInvalidResponseError', error => {
                if (Number(error.apiCode) !== BINANCE_TIMESTAMP_OUTSIDE_WINDOW_CODE) {
                    return Effect.fail(error);
                }

                this.serverTimeOffsetMs = null;

                return this.sendSignedRequest(schema, endpoint, method, params);
            })
        );
    }

    private sendSignedRequest<S extends Schema.ConstraintDecoder<unknown>>(
        schema: S,
        endpoint: string,
        method: HttpMethod,
        params: Record<string, string | number>
    ): Effect.Effect<S['Type'], SyncError, HttpClient.HttpClient> {
        return Effect.gen({ self: this }, function* (this: BinanceSignedClient) {
            if ((yield* Clock.currentTimeMillis) >= this.deadlineAtMs) {
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
                    periodMs: FIAT_MAX_PERIOD_MS,
                    dormancyWindowCount: Math.max(1, Math.ceil(DORMANCY_PERIOD_MS / FIAT_MAX_PERIOD_MS))
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
        const availableStartTimeMs = Math.max(startTimeMs, this.limitedHistoryFloorTimeMs);

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

    private fetchUniversalTransfers(startTimeMs: number, endTimeMs: number) {
        const availableStartTimeMs = Math.max(startTimeMs, this.limitedHistoryFloorTimeMs);

        if (availableStartTimeMs >= endTimeMs) {
            return Effect.succeed<BinanceTransferInterface[]>([]);
        }

        return Effect.forEach(UNIVERSAL_TRANSFER_TYPES, type =>
            this.walkWindowsBackward(
                {
                    startTimeMs: availableStartTimeMs,
                    endTimeMs,
                    periodMs: UNIVERSAL_TRANSFER_MAX_PERIOD_MS,
                    dormancyWindowCount: UNBOUNDED_DORMANCY_WINDOW_COUNT
                },
                (windowStartMs, windowEndMs) =>
                    this.collectPages(current =>
                        this.fetchEarnPage(BinanceUniversalTransferListApiSchema, UNIVERSAL_TRANSFER_ENDPOINT, {
                            type,
                            startTime: windowStartMs,
                            endTime: windowEndMs,
                            current,
                            size: EARN_PAGE_SIZE
                        })
                    )
            )
        ).pipe(
            Effect.map(transfersByType =>
                transfersByType
                    .flat()
                    .filter(transfer => transfer.status === UNIVERSAL_TRANSFER_CONFIRMED_STATUS)
                    .map(transfer => mapBinanceUniversalTransferToTransfer(transfer))
                    .filter(isDefined)
            )
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

    private recordCapitalOutcome(externalId: string, timeMs: number, outcome: BinanceCapitalOutcomeEnum): boolean {
        if (outcome === BinanceCapitalOutcomeEnum.REJECTED) {
            this.rejectedCapitalExternalIds.add(externalId);
        }
        if (outcome === BinanceCapitalOutcomeEnum.PENDING && timeMs >= this.capitalPendingFloorTimeMs) {
            this.capitalPendingFromMs = Math.min(this.capitalPendingFromMs ?? timeMs, timeMs);
        }

        return outcome === BinanceCapitalOutcomeEnum.COMPLETED;
    }

    private cached<T, E, R>(cache: Map<string, T>, key: string, effect: Effect.Effect<T, E, R>): Effect.Effect<T, E, R> {
        return Effect.suspend(() => {
            const hit = cache.get(key);

            return isDefined(hit) ? Effect.succeed(hit) : Effect.tap(effect, value => Effect.sync(() => cache.set(key, value)));
        });
    }

    private getSourceTransactions(
        wallet: BinanceWalletEnum,
        from: number,
        to: number | undefined,
        fetchSources: (
            startTimeMs: number,
            endTimeMs: number
        ) => Effect.Effect<BinanceTransactionSourcesInterface, SyncError, HttpClient.HttpClient>
    ): Effect.Effect<SyncTransactionInterface[], SyncError, HttpClient.HttpClient> {
        return Effect.flatMap(this.resolveSourceWindow(from, to), ({ startTimeMs, endTimeMs }) =>
            Effect.map(fetchSources(startTimeMs, endTimeMs), sources => this.buildSourceTransactions(wallet, sources))
        );
    }

    private decodeAccountId(accountId: string): Effect.Effect<BinanceAccountIdInterface, SyncInvalidResponseError> {
        const decoded = decodeBinanceAccountId(accountId);

        return isDefined(decoded)
            ? Effect.succeed(decoded)
            : Effect.fail(new SyncInvalidResponseError({ provider: this.provider, message: `Invalid Binance account id "${accountId}"` }));
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

    private buildTransactions(
        wallet: BinanceWalletEnum,
        defaultWallet: BinanceWalletEnum,
        asset: string,
        sources: BinanceTransactionSourcesInterface
    ): SyncTransactionInterface[] {
        const accountId = encodeBinanceAccountId({ wallet, asset });
        const isDefaultWallet = wallet === defaultWallet;
        const depositTransactions = sources.deposits
            .filter(deposit => deposit.coin === asset && getBinanceCapitalWallet(deposit) === wallet)
            .map(deposit => mapBinanceDepositToTransaction(deposit, accountId))
            .filter(isDefined);
        const withdrawalTransactions = sources.withdrawals
            .filter(withdrawal => withdrawal.coin === asset && getBinanceCapitalWallet(withdrawal) === wallet)
            .map(withdrawal => mapBinanceWithdrawalToTransaction(withdrawal, accountId))
            .filter(isDefined);
        const fiatDepositTransactions = sources.fiatDeposits
            .filter(order => isDefaultWallet && order.fiatCurrency === asset)
            .map(order => mapBinanceFiatOrderToTransaction(order, accountId, true))
            .filter(isDefined);
        const fiatWithdrawalTransactions = sources.fiatWithdrawals
            .filter(order => isDefaultWallet && order.fiatCurrency === asset)
            .map(order => mapBinanceFiatOrderToTransaction(order, accountId, false))
            .filter(isDefined);
        const c2cTransactions = sources.c2cOrders
            .filter(order => isDefaultWallet && order.asset === asset)
            .map(order => mapBinanceC2cOrderToTransaction(order, accountId))
            .filter(isDefined);
        const assetEarnRewards = sources.earnRewards.filter(reward => isDefaultWallet && reward.asset === asset);
        const earnRewardTransactions = mapBinanceEarnRewardsToTransactions(asset, accountId, assetEarnRewards);

        return [
            ...depositTransactions,
            ...withdrawalTransactions,
            ...fiatDepositTransactions,
            ...fiatWithdrawalTransactions,
            ...c2cTransactions,
            ...earnRewardTransactions
        ].sort((left, right) => right.time - left.time);
    }

    private buildSourceTransactions(
        defaultWallet: BinanceWalletEnum,
        sources: BinanceTransactionSourcesInterface
    ): SyncTransactionInterface[] {
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
            for (const wallet of Object.values(BinanceWalletEnum)) {
                for (const transaction of this.buildTransactions(wallet, defaultWallet, asset, sources)) {
                    byId.set(transaction.id, transaction);
                }
            }
        }

        return [...byId.values()];
    }

    private collectTouchedAssets(
        balances: readonly BinanceAssetBalanceApiInterface[],
        convertTransfers: BinanceTransferInterface[]
    ): Set<string> {
        const touchedAssets = new Set<string>();
        for (const balance of balances) {
            const total = this.computeRawTotalBalance(balance);
            if (isDefined(total) && total > 0) {
                touchedAssets.add(balance.asset);
            }
        }

        for (const transfer of convertTransfers) {
            for (const decoded of [
                decodeBinanceAccountId(transfer.fromAssetAccountId),
                decodeBinanceAccountId(transfer.toAssetAccountId)
            ]) {
                if (isDefined(decoded)) {
                    touchedAssets.add(decoded.asset);
                }
            }
        }

        return touchedAssets;
    }

    private buildTradeSymbolCandidates(
        touchedAssets: Set<string>,
        exchangeSymbols: readonly BinanceTradeSymbolInterface[] | null,
        eligibleSoldOffBaseAssets: Set<string>
    ): BinanceTradeSymbolInterface[] {
        if (isDefined(exchangeSymbols)) {
            return exchangeSymbols.filter(({ baseAsset, quoteAsset }) => {
                const isTouchedBase = touchedAssets.has(baseAsset);
                const isTouchedQuote = touchedAssets.has(quoteAsset);
                const isEligibleBase = isTouchedBase || eligibleSoldOffBaseAssets.has(baseAsset);

                return (isTouchedQuote && isEligibleBase) || (isTouchedBase && MAJOR_QUOTE_ASSETS.includes(quoteAsset));
            });
        }

        const fallbackSymbols: BinanceTradeSymbolInterface[] = [];
        for (const baseAsset of touchedAssets) {
            for (const quoteAsset of MAJOR_QUOTE_ASSETS) {
                if (baseAsset !== quoteAsset) {
                    fallbackSymbols.push({ symbol: `${baseAsset}${quoteAsset}`, baseAsset, quoteAsset });
                }
            }
        }

        return fallbackSymbols;
    }

    private buildSpotBalanceMap(balances: readonly BinanceAssetBalanceApiInterface[]): Map<string, number | null> {
        const balanceByAsset = new Map<string, number | null>();
        for (const balance of balances) {
            const total = this.computeRawTotalBalance(balance);
            if (isDefined(total) && total > 0) {
                balanceByAsset.set(balance.asset, total * PRECISION > Number.MAX_SAFE_INTEGER ? null : total);
            } else if (!isDefined(total)) {
                balanceByAsset.set(balance.asset, null);
            }
        }

        return balanceByAsset;
    }

    private foldEarnPositionAmount(balanceByAsset: Map<string, number | null>, asset: string, rawAmount: string): void {
        const quantity = parseBinanceAmount(rawAmount);
        if (!isDefined(quantity)) {
            balanceByAsset.set(asset, null);

            return;
        }

        const currentBalance = balanceByAsset.get(asset);
        if (quantity <= 0 || (!isDefined(currentBalance) && balanceByAsset.has(asset))) {
            return;
        }

        const nextBalance = (currentBalance ?? 0) + quantity;
        balanceByAsset.set(asset, nextBalance * PRECISION > Number.MAX_SAFE_INTEGER ? null : nextBalance);
    }

    private buildSpotAccounts(balanceByAsset: Map<string, number | null>) {
        return [...balanceByAsset].map(([asset, total]) =>
            isDefined(total)
                ? mapBinanceBalanceToAccount(asset, BinanceWalletEnum.SPOT, total)
                : mapBinanceUnrepresentableBalanceToAccount(asset, BinanceWalletEnum.SPOT)
        );
    }

    private computeRawTotalBalance(balance: BinanceAssetBalanceApiInterface): number | null {
        const free = parseBinanceAmount(balance.free);
        const locked = parseBinanceAmount(balance.locked);
        const freeze = isDefined(balance.freeze) ? parseBinanceAmount(balance.freeze) : 0;
        if (!isDefined(free) || !isDefined(locked) || !isDefined(freeze)) {
            return null;
        }

        return free + locked + freeze;
    }

    private mapBalance(balance: BinanceAssetBalanceApiInterface, wallet: BinanceWalletEnum) {
        const totalBalance = this.computeRawTotalBalance(balance);

        if (isDefined(totalBalance) && totalBalance <= 0) {
            return null;
        }

        if (!isDefined(totalBalance) || totalBalance * PRECISION > Number.MAX_SAFE_INTEGER) {
            return mapBinanceUnrepresentableBalanceToAccount(balance.asset, wallet);
        }

        return mapBinanceBalanceToAccount(balance.asset, wallet, totalBalance);
    }

    private sign(query: string, apiSecret: string): string {
        return bytesToHex(hmac(sha256, utf8ToBytes(apiSecret), utf8ToBytes(query)));
    }
}
