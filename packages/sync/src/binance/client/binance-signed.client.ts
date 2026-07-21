/* eslint-disable max-lines -- File owns a single multi-stage Binance signed-client pipeline (balances, crypto + fiat history, HMAC signing, weight throttle) that must stay together */
import { Log } from '@budgie/logger';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { BaseSyncProviderClient } from '../../core/client/base-sync-provider.client';
import { SyncErrorCodeEnum } from '../../core/enum/sync-error-code.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncError } from '../../core/error/sync.error';
import { syncLogger } from '../../core/util/sync-logger.util';
import { BINANCE_API_BASE_URL } from '../constant/binance-api-base-url.constant';
import { BinanceCredentialsSchema } from '../constant/binance-credentials.schema';
import { BINANCE_DORMANCY_PERIOD_MS } from '../constant/binance-dormancy-period-ms.constant';
import { BINANCE_FIAT_MAX_PERIOD_MS } from '../constant/binance-fiat-max-period-ms.constant';
import { BINANCE_MAJOR_QUOTE_ASSETS } from '../constant/binance-major-quote-asset.constant';
import { BINANCE_MICRO_UNITS_PRECISION as MICRO_UNITS_PRECISION } from '../constant/binance-precision.constant';
import { BINANCE_RETRY_METHODS, BINANCE_RETRY_STATUS_CODES } from '../constant/binance-retry-status-codes.constant';
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

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncClientInfoInterface } from '../../core/interface/sync-client-info.interface';
import type { SyncErrorInterface } from '../../core/interface/sync-error.interface';
import type { SyncResultInterface } from '../../core/interface/sync-result.type';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceCredentialsInterface } from '../constant/binance-credentials.schema';
import type { BinanceAssetBalanceApiInterface } from '../interface/binance-asset-balance-api.schema';
import type { BinanceC2cOrderApiInterface } from '../interface/binance-c2c-order-api.schema';
import type { BinanceConvertFlowApiInterface } from '../interface/binance-convert-api.schema';
import type { BinanceDepositApiInterface } from '../interface/binance-deposit-api.schema';
import type { BinanceEarnPositionApiInterface } from '../interface/binance-earn-position-api.schema';
import type { BinanceEarnRewardApiInterface } from '../interface/binance-earn-reward-api.schema';
import type { BinanceFiatOrderApiInterface } from '../interface/binance-fiat-order-api.schema';
import type { BinanceLockedEarnPositionApiInterface } from '../interface/binance-locked-earn-position-api.schema';
import type { BinanceTradeSymbolInterface } from '../interface/binance-trade-symbol.interface';
import type { BinanceTransactionSourcesInterface } from '../interface/binance-transaction-sources.interface';
import type { BinanceTransferInterface } from '../interface/binance-transfer.interface';
import type { BinanceWindowWalkConfigInterface } from '../interface/binance-window-walk-config.interface';
import type { BinanceWithdrawalApiInterface } from '../interface/binance-withdrawal-api.schema';

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
const EARN_REWARD_MAX_PERIOD_MS = 2592000000;
const UNBOUNDED_DORMANCY_WINDOW_COUNT = Number.MAX_SAFE_INTEGER;
const EARN_REWARD_TYPE_ALL = 'ALL';
const EARN_PAGE_SIZE = 100;
const TRADES_PER_SYMBOL_LIMIT = 1000;
const EARN_LD_PREFIX = 'LD';

export class BinanceSignedClient extends BaseSyncProviderClient {
    protected readonly provider = SyncProviderEnum.BINANCE;
    protected readonly baseUrl = BINANCE_API_BASE_URL;

    private readonly credentials: BinanceCredentialsInterface;
    private readonly throttle: BinanceWeightThrottle;
    private readonly depositCache = new Map<string, BinanceDepositApiInterface[]>();
    private readonly withdrawalCache = new Map<string, BinanceWithdrawalApiInterface[]>();
    private readonly fiatOrderCache = new Map<string, BinanceFiatOrderApiInterface[]>();
    private readonly c2cOrderCache = new Map<string, BinanceC2cOrderApiInterface[]>();
    private readonly earnRewardCache = new Map<string, BinanceEarnRewardApiInterface[]>();
    private readonly transferCache = new Map<string, BinanceTransferInterface[]>();
    private serverTimeOffsetMs: number | undefined;
    private validSymbols: Set<string> | undefined;

    constructor(token: string, deadlineAtMs = Number.POSITIVE_INFINITY) {
        super(token, { retryStatusCodes: BINANCE_RETRY_STATUS_CODES, retryMethods: BINANCE_RETRY_METHODS });
        this.credentials = BinanceSignedClient.parseCredentials(token);
        this.throttle = new BinanceWeightThrottle(deadlineAtMs);
    }

    @Log('enter', 'done')
    async getClientInfo(): Promise<SyncResultInterface<SyncClientInfoInterface>> {
        return this.success({
            id: SyncProviderEnum.BINANCE,
            name: SyncProviderEnum.BINANCE,
            provider: this.provider
        });
    }

    @Log(
        'enter',
        result => `done success=${String(result.success)} count=${result.success ? result.data.length : 0}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getAccounts(): Promise<SyncResultInterface<SyncAccountInterface[]>> {
        const spotResult = await this.fetchSpotBalancesWithEarn();
        if (!spotResult.success) {
            return spotResult;
        }

        const fundingResult = await this.fetchWalletBalances(BinanceWalletEnum.FUNDING);
        if (!fundingResult.success) {
            return fundingResult;
        }

        return this.success([...spotResult.data, ...fundingResult.data]);
    }

    @Log(
        (accountId, from, to) => `enter accountId=${accountId} from=${from} to=${to ?? 'now'}`,
        result => `done transferCount=${result.success ? result.data.length : 0}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getTransactions(accountId: string, from: number, to?: number): Promise<SyncResultInterface<SyncTransactionInterface[]>> {
        return this.withDecodedAccount(accountId, from, to, async (decoded, startTimeMs, endTimeMs) => {
            const sourcesResult = await this.fetchTransactionSources(decoded.wallet, startTimeMs, endTimeMs);

            return sourcesResult.success
                ? this.success(this.buildTransactions(accountId, decoded.asset, sourcesResult.data))
                : sourcesResult;
        });
    }

    @Log(
        (from, to) => `enter from=${from} to=${to ?? 'now'}`,
        result => `done count=${result.success ? result.data.length : 0}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getC2cTransactions(from: number, to?: number): Promise<SyncResultInterface<SyncTransactionInterface[]>> {
        return this.getSourceTransactions(from, to, async (startTimeMs, endTimeMs) => {
            const c2cOrdersResult = await this.fetchC2cOrders(startTimeMs, endTimeMs);

            return c2cOrdersResult.success ? this.success(this.emptySources({ c2cOrders: c2cOrdersResult.data })) : c2cOrdersResult;
        });
    }

    @Log(
        (from, to) => `enter from=${from} to=${to ?? 'now'}`,
        result => `done count=${result.success ? result.data.length : 0}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getEarnTransactions(from: number, to?: number): Promise<SyncResultInterface<SyncTransactionInterface[]>> {
        return this.getSourceTransactions(from, to, async (startTimeMs, endTimeMs) => {
            const earnRewardsResult = await this.fetchEarnRewards(startTimeMs, endTimeMs);

            return earnRewardsResult.success ? this.success(this.emptySources({ earnRewards: earnRewardsResult.data })) : earnRewardsResult;
        });
    }

    @Log(
        (from, to) => `enter from=${from} to=${to ?? 'now'}`,
        result => `done count=${result.success ? result.data.length : 0}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getCapitalTransactions(from: number, to?: number): Promise<SyncResultInterface<SyncTransactionInterface[]>> {
        return this.getSourceTransactions(from, to, (startTimeMs, endTimeMs) =>
            this.fetchCapitalSources(BinanceWalletEnum.SPOT, startTimeMs, endTimeMs)
        );
    }

    @Log(
        (from, to) => `enter from=${from} to=${to ?? 'now'}`,
        result => `done count=${result.success ? result.data.length : 0}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getFiatTransactions(from: number, to?: number): Promise<SyncResultInterface<SyncTransactionInterface[]>> {
        return this.getSourceTransactions(from, to, (startTimeMs, endTimeMs) => this.fetchFiatSources(startTimeMs, endTimeMs));
    }

    @Log(
        (accountId, from, to) => `enter accountId=${accountId} from=${from} to=${to ?? 'now'}`,
        result => `done count=${result.success ? result.data.length : 0}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getTransfers(accountId: string, from: number, to?: number): Promise<SyncResultInterface<BinanceTransferInterface[]>> {
        return this.withDecodedAccount(accountId, from, to, (_decoded, startTimeMs, endTimeMs) =>
            this.fetchAllTransfers(startTimeMs, endTimeMs)
        );
    }

    protected getDefaultHeaders(): Record<string, string> {
        return {
            'X-MBX-APIKEY': this.credentials.apiKey,
            'Content-Type': 'application/json'
        };
    }

    protected override onResponseHeaders(headers: Headers): void {
        this.throttle.recordHeaders(headers);
    }

    // eslint-disable-next-line max-statements -- Orchestrates six sequential guarded fetches (c2c, earn, deposits, withdrawals, fiat) into one sources result
    private async fetchTransactionSources(
        wallet: BinanceWalletEnum,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceTransactionSourcesInterface>> {
        const isSpot = wallet === BinanceWalletEnum.SPOT;

        const c2cOrdersResult = isSpot
            ? await this.fetchC2cOrders(startTimeMs, endTimeMs)
            : this.success<BinanceC2cOrderApiInterface[]>([]);
        if (!c2cOrdersResult.success) {
            return c2cOrdersResult;
        }

        const earnRewardsResult = isSpot
            ? await this.fetchEarnRewards(startTimeMs, endTimeMs)
            : this.success<BinanceEarnRewardApiInterface[]>([]);
        if (!earnRewardsResult.success) {
            return earnRewardsResult;
        }

        const capitalSourcesResult = await this.fetchCapitalSources(wallet, startTimeMs, endTimeMs);
        if (!capitalSourcesResult.success) {
            return capitalSourcesResult;
        }

        const fiatSourcesResult = await this.fetchFiatSources(startTimeMs, endTimeMs);
        if (!fiatSourcesResult.success) {
            return fiatSourcesResult;
        }

        return this.success({
            deposits: capitalSourcesResult.data.deposits,
            withdrawals: capitalSourcesResult.data.withdrawals,
            fiatDeposits: fiatSourcesResult.data.fiatDeposits,
            fiatWithdrawals: fiatSourcesResult.data.fiatWithdrawals,
            c2cOrders: c2cOrdersResult.data,
            earnRewards: earnRewardsResult.data
        });
    }

    private resolveSourceWindow(from: number, to?: number): { startTimeMs: number; endTimeMs: number } {
        const startTimeMs = from * MILLISECONDS_PER_SECOND;
        const endTimeMs = isDefined(to) ? to * MILLISECONDS_PER_SECOND : Date.now();

        return { startTimeMs, endTimeMs };
    }

    private async getSourceTransactions(
        from: number,
        to: number | undefined,
        fetchSources: (startTimeMs: number, endTimeMs: number) => Promise<SyncResultInterface<BinanceTransactionSourcesInterface>>
    ): Promise<SyncResultInterface<SyncTransactionInterface[]>> {
        const { startTimeMs, endTimeMs } = this.resolveSourceWindow(from, to);
        const sourcesResult = await fetchSources(startTimeMs, endTimeMs);
        if (!sourcesResult.success) {
            return sourcesResult;
        }

        return this.success(this.dedupeTransactions(this.buildSourceTransactions(BinanceWalletEnum.SPOT, sourcesResult.data)));
    }

    private async withDecodedAccount<T>(
        accountId: string,
        from: number,
        to: number | undefined,
        execute: (
            decoded: NonNullable<ReturnType<typeof decodeBinanceAccountId>>,
            startTimeMs: number,
            endTimeMs: number
        ) => Promise<SyncResultInterface<T>>
    ): Promise<SyncResultInterface<T>> {
        const decoded = decodeBinanceAccountId(accountId);
        if (!isDefined(decoded)) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        const { startTimeMs, endTimeMs } = this.resolveSourceWindow(from, to);

        return execute(decoded, startTimeMs, endTimeMs);
    }

    private async fetchCapitalSources(
        wallet: BinanceWalletEnum,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceTransactionSourcesInterface>> {
        const depositsResult = await this.fetchDeposits(wallet, startTimeMs, endTimeMs);
        if (!depositsResult.success) {
            return depositsResult;
        }

        const withdrawalsResult = await this.fetchWithdrawals(wallet, startTimeMs, endTimeMs);
        if (!withdrawalsResult.success) {
            return withdrawalsResult;
        }

        return this.success(this.emptySources({ deposits: depositsResult.data, withdrawals: withdrawalsResult.data }));
    }

    private async fetchFiatSources(
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceTransactionSourcesInterface>> {
        const fiatDepositsResult = await this.fetchFiatOrders(FIAT_DEPOSIT_TRANSACTION_TYPE, startTimeMs, endTimeMs);
        if (!fiatDepositsResult.success) {
            return fiatDepositsResult;
        }

        const fiatWithdrawalsResult = await this.fetchFiatOrders(FIAT_WITHDRAW_TRANSACTION_TYPE, startTimeMs, endTimeMs);
        if (!fiatWithdrawalsResult.success) {
            return fiatWithdrawalsResult;
        }

        return this.success(this.emptySources({ fiatDeposits: fiatDepositsResult.data, fiatWithdrawals: fiatWithdrawalsResult.data }));
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

    private resolveDormancyWindowCount(periodMs: number): number {
        return Math.max(1, Math.ceil(BINANCE_DORMANCY_PERIOD_MS / periodMs));
    }

    private async walkWindowsBackward<T>(
        config: BinanceWindowWalkConfigInterface,
        fetchOneWindow: (windowStartMs: number, windowEndMs: number) => Promise<SyncResultInterface<T[]>>
    ): Promise<SyncResultInterface<T[]>> {
        const records: T[] = [];
        let windowEndMs = config.endTimeMs;
        let consecutiveEmptyWindows = 0;
        while (consecutiveEmptyWindows < config.dormancyWindowCount && windowEndMs > config.startTimeMs) {
            const windowStartMs = Math.max(config.startTimeMs, windowEndMs - config.periodMs);
            // eslint-disable-next-line no-await-in-loop -- Windows must be fetched sequentially so the weight throttle serializes the heaviest calls
            const windowResult = await fetchOneWindow(windowStartMs, windowEndMs);
            if (!windowResult.success) {
                return windowResult;
            }

            consecutiveEmptyWindows = this.accumulateWindow(records, windowResult.data, consecutiveEmptyWindows);
            windowEndMs = windowStartMs;
        }

        return this.success(records);
    }

    private accumulateWindow<T>(records: T[], windowData: T[], consecutiveEmptyWindows: number): number {
        records.push(...windowData);

        return isNotEmptyArray(windowData) ? 0 : consecutiveEmptyWindows + 1;
    }

    private async fetchDeposits(
        wallet: BinanceWalletEnum,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceDepositApiInterface[]>> {
        return this.walkWindowsBackward(
            { startTimeMs, endTimeMs, periodMs: CAPITAL_HISTORY_MAX_PERIOD_MS, dormancyWindowCount: UNBOUNDED_DORMANCY_WINDOW_COUNT },
            (windowStartMs, windowEndMs) => this.fetchDepositWindow(wallet, windowStartMs, windowEndMs)
        );
    }

    private async fetchDepositWindow(
        wallet: BinanceWalletEnum,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceDepositApiInterface[]>> {
        const cacheKey = `${wallet}:${DEPOSIT_HISTORY_ENDPOINT}:${startTimeMs}-${endTimeMs}`;
        const cached = this.depositCache.get(cacheKey);
        if (isDefined(cached)) {
            return this.success(cached);
        }

        const result = await this.signedRequest(DEPOSIT_HISTORY_ENDPOINT, 'GET', {
            startTime: startTimeMs,
            endTime: endTimeMs,
            limit: MAX_TRANSACTIONS_PER_WINDOW
        });
        if (!result.success) {
            return result;
        }

        const parsed = BinanceDepositListApiSchema.safeParse(result.data);
        if (!parsed.success) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        this.depositCache.set(cacheKey, parsed.data);

        return this.success(parsed.data);
    }

    private async fetchWithdrawals(
        wallet: BinanceWalletEnum,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceWithdrawalApiInterface[]>> {
        return this.walkWindowsBackward(
            { startTimeMs, endTimeMs, periodMs: CAPITAL_HISTORY_MAX_PERIOD_MS, dormancyWindowCount: UNBOUNDED_DORMANCY_WINDOW_COUNT },
            (windowStartMs, windowEndMs) => this.fetchWithdrawalWindow(wallet, windowStartMs, windowEndMs)
        );
    }

    private async fetchWithdrawalWindow(
        wallet: BinanceWalletEnum,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceWithdrawalApiInterface[]>> {
        const cacheKey = `${wallet}:${WITHDRAW_HISTORY_ENDPOINT}:${startTimeMs}-${endTimeMs}`;
        const cached = this.withdrawalCache.get(cacheKey);
        if (isDefined(cached)) {
            return this.success(cached);
        }

        const result = await this.signedRequest(WITHDRAW_HISTORY_ENDPOINT, 'GET', {
            startTime: startTimeMs,
            endTime: endTimeMs,
            limit: MAX_TRANSACTIONS_PER_WINDOW
        });
        if (!result.success) {
            return result;
        }

        const parsed = BinanceWithdrawalListApiSchema.safeParse(result.data);
        if (!parsed.success) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        this.withdrawalCache.set(cacheKey, parsed.data);

        return this.success(parsed.data);
    }

    private async fetchFiatOrders(
        transactionType: number,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceFiatOrderApiInterface[]>> {
        const cacheKey = `${transactionType}:${FIAT_ORDERS_ENDPOINT}:${startTimeMs}-${endTimeMs}`;
        const cached = this.fiatOrderCache.get(cacheKey);
        if (isDefined(cached)) {
            return this.success(cached);
        }

        const result = await this.fetchAllFiatOrderWindows(transactionType, startTimeMs, endTimeMs);
        if (result.success) {
            this.fiatOrderCache.set(cacheKey, result.data);
        }

        return result;
    }

    private async fetchAllFiatOrderWindows(
        transactionType: number,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceFiatOrderApiInterface[]>> {
        return this.walkWindowsBackward(
            {
                startTimeMs,
                endTimeMs,
                periodMs: BINANCE_FIAT_MAX_PERIOD_MS,
                dormancyWindowCount: this.resolveDormancyWindowCount(BINANCE_FIAT_MAX_PERIOD_MS)
            },
            (windowStartMs, windowEndMs) => this.fetchFiatOrderWindow(transactionType, windowStartMs, windowEndMs)
        );
    }

    private async fetchFiatOrderWindow(
        transactionType: number,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceFiatOrderApiInterface[]>> {
        return this.fetchPagedOrders(page => this.fetchFiatOrderPage(transactionType, startTimeMs, endTimeMs, page));
    }

    private async fetchFiatOrderPage(
        transactionType: number,
        startTimeMs: number,
        endTimeMs: number,
        page: number
    ): Promise<SyncResultInterface<{ orders: BinanceFiatOrderApiInterface[]; hasMore: boolean }>> {
        const result = await this.signedRequest(FIAT_ORDERS_ENDPOINT, 'GET', {
            transactionType,
            beginTime: startTimeMs,
            endTime: endTimeMs,
            page,
            rows: FIAT_ROWS_PER_PAGE
        });
        if (!result.success) {
            return result;
        }

        const parsed = BinanceFiatOrderListApiSchema.safeParse(result.data);
        if (!parsed.success) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        const orders = parsed.data.data.filter(order => order.status === FIAT_SUCCESSFUL_STATUS);

        return this.success({ orders, hasMore: parsed.data.data.length === FIAT_ROWS_PER_PAGE });
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
        const transactions: SyncTransactionInterface[] = [];
        for (const asset of this.collectSourceAssets(sources)) {
            const accountId = encodeBinanceAccountId({ wallet, asset });
            transactions.push(...this.buildTransactions(accountId, asset, sources));
        }

        return transactions;
    }

    private dedupeTransactions(transactions: SyncTransactionInterface[]): SyncTransactionInterface[] {
        const byId = new Map<string, SyncTransactionInterface>();
        for (const transaction of transactions) {
            byId.set(transaction.id, transaction);
        }

        return [...byId.values()];
    }

    private collectSourceAssets(sources: BinanceTransactionSourcesInterface): Set<string> {
        const assets = [
            ...sources.deposits.map(deposit => deposit.coin),
            ...sources.withdrawals.map(withdrawal => withdrawal.coin),
            ...sources.fiatDeposits.map(order => order.fiatCurrency),
            ...sources.fiatWithdrawals.map(order => order.fiatCurrency),
            ...sources.c2cOrders.map(order => order.asset),
            ...sources.earnRewards.map(reward => reward.asset)
        ];

        return new Set(assets);
    }

    private async fetchAllTransfers(startTimeMs: number, endTimeMs: number): Promise<SyncResultInterface<BinanceTransferInterface[]>> {
        const cacheKey = `${startTimeMs}-${endTimeMs}`;
        const cached = this.transferCache.get(cacheKey);
        if (isDefined(cached)) {
            return this.success(cached);
        }

        const result = await this.fetchTradesAndConverts(startTimeMs, endTimeMs);
        if (result.success) {
            this.transferCache.set(cacheKey, result.data);
        }

        return result;
    }

    private async fetchTradesAndConverts(startTimeMs: number, endTimeMs: number): Promise<SyncResultInterface<BinanceTransferInterface[]>> {
        const convertResult = await this.fetchConvertTransfers(startTimeMs, endTimeMs);
        if (!convertResult.success) {
            return convertResult;
        }

        const tradeResult = await this.fetchTradeTransfers(startTimeMs, endTimeMs, convertResult.data);
        if (!tradeResult.success) {
            return tradeResult;
        }

        return this.success(this.dedupeTransfers([...tradeResult.data, ...convertResult.data]));
    }

    private dedupeTransfers(transfers: BinanceTransferInterface[]): BinanceTransferInterface[] {
        const byExternalId = new Map<string, BinanceTransferInterface>();
        for (const transfer of transfers) {
            byExternalId.set(transfer.externalId, transfer);
        }

        return [...byExternalId.values()];
    }

    private async fetchConvertTransfers(startTimeMs: number, endTimeMs: number): Promise<SyncResultInterface<BinanceTransferInterface[]>> {
        const flowsResult = await this.fetchAllConvertWindows(startTimeMs, endTimeMs);
        if (!flowsResult.success) {
            return flowsResult;
        }

        const transfers = flowsResult.data.map(flow => binanceMapper.mapConvertToTransfer(flow)).filter(isDefined);

        return this.success(transfers);
    }

    private async fetchAllConvertWindows(
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceConvertFlowApiInterface[]>> {
        return this.walkWindowsBackward(
            { startTimeMs, endTimeMs, periodMs: CONVERT_MAX_PERIOD_MS, dormancyWindowCount: UNBOUNDED_DORMANCY_WINDOW_COUNT },
            (windowStartMs, windowEndMs) => this.fetchConvertWindow(windowStartMs, windowEndMs)
        );
    }

    private async fetchConvertWindow(
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceConvertFlowApiInterface[]>> {
        const result = await this.fetchConvertWindowChunk(startTimeMs, endTimeMs);
        if (!result.success || !result.data.moreData || endTimeMs <= startTimeMs) {
            return result.success ? this.success(result.data.list) : result;
        }

        const midpointMs = Math.floor((startTimeMs + endTimeMs) / 2);
        const olderResult = await this.fetchConvertWindow(startTimeMs, midpointMs);
        if (!olderResult.success) {
            return olderResult;
        }

        const newerResult = await this.fetchConvertWindow(midpointMs + 1, endTimeMs);
        if (!newerResult.success) {
            return newerResult;
        }

        return this.success([...olderResult.data, ...newerResult.data]);
    }

    private async fetchConvertWindowChunk(
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<{ list: BinanceConvertFlowApiInterface[]; moreData: boolean }>> {
        const result = await this.signedRequest(CONVERT_TRADE_FLOW_ENDPOINT, 'GET', {
            startTime: startTimeMs,
            endTime: endTimeMs,
            limit: CONVERT_ROWS_PER_PAGE
        });
        if (!result.success) {
            return result;
        }

        const parsed = BinanceConvertTradeFlowApiSchema.safeParse(result.data);
        if (!parsed.success) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        return this.success({ list: parsed.data.list, moreData: parsed.data.moreData });
    }

    private async fetchTradeTransfers(
        startTimeMs: number,
        endTimeMs: number,
        convertTransfers: BinanceTransferInterface[]
    ): Promise<SyncResultInterface<BinanceTransferInterface[]>> {
        const symbolsResult = await this.deriveTradeSymbols(startTimeMs, endTimeMs, convertTransfers);
        if (!symbolsResult.success) {
            return symbolsResult;
        }

        syncLogger.log('binance:trades:symbols', { symbols: symbolsResult.data.map(symbol => symbol.symbol).join(',') });

        const transfers: BinanceTransferInterface[] = [];
        for (const symbol of symbolsResult.data) {
            // eslint-disable-next-line no-await-in-loop -- Per-symbol myTrades calls must be paced sequentially against the shared api IP weight pool
            const symbolResult = await this.fetchSymbolTrades(symbol, startTimeMs, endTimeMs);
            if (!symbolResult.success) {
                return symbolResult;
            }

            transfers.push(...symbolResult.data);
        }

        syncLogger.log('binance:trades:counts', {
            symbols: symbolsResult.data.map(symbol => symbol.symbol).join(','),
            count: transfers.length
        });

        return this.success(transfers);
    }

    private async deriveTradeSymbols(
        startTimeMs: number,
        endTimeMs: number,
        convertTransfers: BinanceTransferInterface[]
    ): Promise<SyncResultInterface<BinanceTradeSymbolInterface[]>> {
        const balanceResult = await this.signedRequest(SPOT_BALANCE_ENDPOINT, 'POST');
        if (!balanceResult.success) {
            return balanceResult;
        }

        const parsed = BinanceAssetBalanceListApiSchema.safeParse(balanceResult.data);
        if (!parsed.success) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        const baseAssets = this.collectBaseAssets(parsed.data, convertTransfers);
        await this.addHistoryAssets(baseAssets, startTimeMs, endTimeMs);
        const candidates = this.buildSymbolPairs(baseAssets);
        const validSymbols = await this.resolveValidSymbols();

        return this.success(this.filterCandidatesByExchangeInfo(candidates, validSymbols));
    }

    private filterCandidatesByExchangeInfo(
        candidates: BinanceTradeSymbolInterface[],
        validSymbols: Set<string> | null
    ): BinanceTradeSymbolInterface[] {
        if (!isDefined(validSymbols)) {
            syncLogger.log('binance:exchange-info:fallback', { candidates: candidates.length });

            return candidates;
        }

        const symbols = candidates.filter(candidate => validSymbols.has(candidate.symbol));
        syncLogger.log('binance:exchange-info:filtered', { candidates: candidates.length, valid: symbols.length });

        return symbols;
    }

    private async resolveValidSymbols(): Promise<Set<string> | null> {
        if (isDefined(this.validSymbols)) {
            return this.validSymbols;
        }

        await this.throttle.waitIfNeeded();

        const result = await this.fetchJson<unknown>(EXCHANGE_INFO_ENDPOINT);
        if (!result.success) {
            return null;
        }

        const parsed = BinanceExchangeInfoApiSchema.safeParse(result.data);
        if (!parsed.success) {
            return null;
        }

        this.validSymbols = new Set(
            parsed.data.symbols.filter(symbol => symbol.status === EXCHANGE_INFO_TRADING_STATUS).map(symbol => symbol.symbol)
        );

        return this.validSymbols;
    }

    private collectBaseAssets(balances: BinanceAssetBalanceApiInterface[], convertTransfers: BinanceTransferInterface[]): Set<string> {
        const baseAssets = new Set<string>();
        for (const balance of balances) {
            const total = this.computeRawTotalBalance(balance);
            const isSpotTradeable = !balance.asset.startsWith(EARN_LD_PREFIX);
            if (isDefined(total) && total > 0 && isSpotTradeable) {
                baseAssets.add(balance.asset);
            }
        }

        for (const transfer of convertTransfers) {
            this.addTransferAssets(baseAssets, transfer);
        }

        return baseAssets;
    }

    private async addHistoryAssets(baseAssets: Set<string>, startTimeMs: number, endTimeMs: number): Promise<void> {
        const depositsResult = await this.fetchDeposits(BinanceWalletEnum.SPOT, startTimeMs, endTimeMs);
        if (depositsResult.success) {
            depositsResult.data.forEach(deposit => baseAssets.add(deposit.coin));
        }

        const withdrawalsResult = await this.fetchWithdrawals(BinanceWalletEnum.SPOT, startTimeMs, endTimeMs);
        if (withdrawalsResult.success) {
            withdrawalsResult.data.forEach(withdrawal => baseAssets.add(withdrawal.coin));
        }

        const c2cOrdersResult = await this.fetchC2cOrders(startTimeMs, endTimeMs);
        if (c2cOrdersResult.success) {
            c2cOrdersResult.data.forEach(order => baseAssets.add(order.asset));
        }
    }

    private addTransferAssets(baseAssets: Set<string>, transfer: BinanceTransferInterface): void {
        const fromDecoded = decodeBinanceAccountId(transfer.fromAssetAccountId);
        const toDecoded = decodeBinanceAccountId(transfer.toAssetAccountId);
        if (isDefined(fromDecoded)) {
            baseAssets.add(fromDecoded.asset);
        }
        if (isDefined(toDecoded)) {
            baseAssets.add(toDecoded.asset);
        }
    }

    private buildSymbolPairs(baseAssets: Set<string>): BinanceTradeSymbolInterface[] {
        const symbols: BinanceTradeSymbolInterface[] = [];
        for (const baseAsset of baseAssets) {
            for (const quoteAsset of BINANCE_MAJOR_QUOTE_ASSETS) {
                if (baseAsset !== quoteAsset) {
                    symbols.push({ symbol: `${baseAsset}${quoteAsset}`, baseAsset, quoteAsset });
                }
            }
        }

        return symbols;
    }

    private async fetchSymbolTrades(
        symbol: BinanceTradeSymbolInterface,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceTransferInterface[]>> {
        const transfers: BinanceTransferInterface[] = [];
        let fromId = 0;
        let hasMore = true;
        while (hasMore) {
            // eslint-disable-next-line no-await-in-loop -- myTrades pages must be fetched sequentially via the fromId cursor against the shared api IP weight pool
            const pageResult = await this.fetchSymbolTradePage(symbol, fromId, startTimeMs, endTimeMs);
            if (!pageResult.success) {
                return pageResult;
            }

            transfers.push(...pageResult.data.transfers);
            hasMore = isDefined(pageResult.data.nextFromId);
            fromId = pageResult.data.nextFromId ?? fromId;
        }

        return this.success(transfers);
    }

    private async fetchSymbolTradePage(
        symbol: BinanceTradeSymbolInterface,
        fromId: number,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<{ transfers: BinanceTransferInterface[]; nextFromId: number | null }>> {
        const result = await this.signedRequest(MY_TRADES_ENDPOINT, 'GET', {
            symbol: symbol.symbol,
            fromId,
            limit: TRADES_PER_SYMBOL_LIMIT
        });
        if (!result.success) {
            return this.handleSymbolTradePageFailure(result, symbol.symbol);
        }

        const parsed = BinanceTradeListApiSchema.safeParse(result.data);
        if (!parsed.success) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        const transfers = parsed.data
            .filter(trade => trade.time >= startTimeMs && trade.time <= endTimeMs)
            .map(trade => binanceMapper.mapTradeToTransfer(trade, symbol.baseAsset, symbol.quoteAsset))
            .filter(isDefined);
        const lastTrade = parsed.data.at(-1);
        const nextFromId = parsed.data.length === TRADES_PER_SYMBOL_LIMIT && isDefined(lastTrade) ? lastTrade.id + 1 : null;

        return this.success({ transfers, nextFromId });
    }

    private handleSymbolTradePageFailure(
        result: SyncResultInterface<unknown> & { success: false },
        symbol: string
    ): SyncResultInterface<{ transfers: BinanceTransferInterface[]; nextFromId: number | null }> {
        if (result.error.code === SyncErrorCodeEnum.INVALID_RESPONSE) {
            syncLogger.log('binance:trades:unknown-symbol', { symbol });

            return this.success({ transfers: [], nextFromId: null });
        }

        return result;
    }

    private async fetchC2cOrders(startTimeMs: number, endTimeMs: number): Promise<SyncResultInterface<BinanceC2cOrderApiInterface[]>> {
        const cacheKey = `${startTimeMs}-${endTimeMs}`;
        const cached = this.c2cOrderCache.get(cacheKey);
        if (isDefined(cached)) {
            return this.success(cached);
        }

        const result = await this.fetchC2cBuyAndSell(startTimeMs, endTimeMs);
        if (result.success) {
            this.c2cOrderCache.set(cacheKey, result.data);
        }

        return result;
    }

    private async fetchC2cBuyAndSell(startTimeMs: number, endTimeMs: number): Promise<SyncResultInterface<BinanceC2cOrderApiInterface[]>> {
        const buyResult = await this.fetchC2cOrdersByType(C2C_BUY_TRADE_TYPE, startTimeMs, endTimeMs);
        if (!buyResult.success) {
            return buyResult;
        }

        const sellResult = await this.fetchC2cOrdersByType(C2C_SELL_TRADE_TYPE, startTimeMs, endTimeMs);
        if (!sellResult.success) {
            return sellResult;
        }

        return this.success([...buyResult.data, ...sellResult.data]);
    }

    private async fetchC2cOrdersByType(
        tradeType: string,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceC2cOrderApiInterface[]>> {
        return this.walkWindowsBackward(
            { startTimeMs, endTimeMs, periodMs: C2C_MAX_PERIOD_MS, dormancyWindowCount: UNBOUNDED_DORMANCY_WINDOW_COUNT },
            (windowStartMs, windowEndMs) => this.fetchC2cOrderWindow(tradeType, windowStartMs, windowEndMs)
        );
    }

    private async fetchC2cOrderWindow(
        tradeType: string,
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceC2cOrderApiInterface[]>> {
        return this.fetchPagedOrders(page => this.fetchC2cOrderPage(tradeType, startTimeMs, endTimeMs, page));
    }

    private async fetchC2cOrderPage(
        tradeType: string,
        startTimeMs: number,
        endTimeMs: number,
        page: number
    ): Promise<SyncResultInterface<{ orders: BinanceC2cOrderApiInterface[]; hasMore: boolean }>> {
        const result = await this.signedRequest(C2C_ORDERS_ENDPOINT, 'GET', {
            tradeType,
            startTimestamp: startTimeMs,
            endTimestamp: endTimeMs,
            page,
            rows: C2C_ROWS_PER_PAGE
        });
        if (!result.success) {
            return this.handleC2cFailure(result.error, tradeType);
        }

        const parsed = BinanceC2cOrderListApiSchema.safeParse(result.data);
        if (!parsed.success) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        const orders = parsed.data.data.filter(order => order.orderStatus === C2C_COMPLETED_STATUS);

        return this.success({ orders, hasMore: parsed.data.data.length === C2C_ROWS_PER_PAGE });
    }

    private handleC2cFailure(
        error: SyncErrorInterface,
        tradeType: string
    ): SyncResultInterface<{ orders: BinanceC2cOrderApiInterface[]; hasMore: boolean }> {
        if (error.code === SyncErrorCodeEnum.UNAUTHORIZED) {
            syncLogger.log('binance:c2c:unavailable', { tradeType, message: error.message });

            return this.success({ orders: [], hasMore: false });
        }

        return this.failure(error);
    }

    private fetchPagedOrders<T>(
        fetchPage: (page: number) => Promise<SyncResultInterface<{ orders: T[]; hasMore: boolean }>>
    ): Promise<SyncResultInterface<T[]>> {
        const orders: T[] = [];

        return this.fetchNextOrderPage(fetchPage, 1, orders);
    }

    private fetchNextOrderPage<T>(
        fetchPage: (page: number) => Promise<SyncResultInterface<{ orders: T[]; hasMore: boolean }>>,
        page: number,
        orders: T[]
    ): Promise<SyncResultInterface<T[]>> {
        return fetchPage(page).then(pageResult => {
            if (!pageResult.success) {
                return pageResult;
            }

            orders.push(...pageResult.data.orders);

            return pageResult.data.hasMore ? this.fetchNextOrderPage(fetchPage, page + 1, orders) : this.success(orders);
        });
    }

    private async fetchEarnRewards(startTimeMs: number, endTimeMs: number): Promise<SyncResultInterface<BinanceEarnRewardApiInterface[]>> {
        const cacheKey = `${startTimeMs}-${endTimeMs}`;
        const cached = this.earnRewardCache.get(cacheKey);
        if (isDefined(cached)) {
            return this.success(cached);
        }

        const result = await this.fetchAllEarnRewardWindows(startTimeMs, endTimeMs);
        if (result.success) {
            this.earnRewardCache.set(cacheKey, result.data);
        }

        return result;
    }

    private async fetchAllEarnRewardWindows(
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceEarnRewardApiInterface[]>> {
        return this.walkWindowsBackward(
            { startTimeMs, endTimeMs, periodMs: EARN_REWARD_MAX_PERIOD_MS, dormancyWindowCount: UNBOUNDED_DORMANCY_WINDOW_COUNT },
            (windowStartMs, windowEndMs) => this.fetchEarnRewardWindow(windowStartMs, windowEndMs)
        );
    }

    private async fetchEarnRewardWindow(
        startTimeMs: number,
        endTimeMs: number
    ): Promise<SyncResultInterface<BinanceEarnRewardApiInterface[]>> {
        const rewards: BinanceEarnRewardApiInterface[] = [];
        let current = 1;
        let hasMore = true;
        while (hasMore) {
            // eslint-disable-next-line no-await-in-loop -- Earn reward pages must be fetched sequentially so the weight throttle serializes the heaviest calls
            const pageResult = await this.fetchEarnRewardPage(startTimeMs, endTimeMs, current);
            if (!pageResult.success) {
                return pageResult;
            }

            rewards.push(...pageResult.data);
            hasMore = pageResult.data.length === EARN_PAGE_SIZE;
            current += 1;
        }

        return this.success(rewards);
    }

    private async fetchEarnRewardPage(
        startTimeMs: number,
        endTimeMs: number,
        current: number
    ): Promise<SyncResultInterface<BinanceEarnRewardApiInterface[]>> {
        const result = await this.signedRequest(EARN_REWARDS_ENDPOINT, 'GET', {
            type: EARN_REWARD_TYPE_ALL,
            startTime: startTimeMs,
            endTime: endTimeMs,
            current,
            size: EARN_PAGE_SIZE
        });
        if (!result.success) {
            return result;
        }

        const parsed = BinanceEarnRewardListApiSchema.safeParse(result.data);
        if (!parsed.success) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        return this.success(parsed.data.rows);
    }

    private async fetchSpotBalancesWithEarn(): Promise<SyncResultInterface<SyncAccountInterface[]>> {
        const balancesResult = await this.fetchBalances(SPOT_BALANCE_ENDPOINT);
        if (!balancesResult.success) {
            return balancesResult;
        }

        const balanceByAsset = this.buildSpotBalanceMap(balancesResult.data);

        const earnFailure = await this.foldAllEarnPositions(balanceByAsset);
        if (isDefined(earnFailure)) {
            return earnFailure;
        }

        return this.success(this.buildSpotAccounts(balanceByAsset));
    }

    private async foldAllEarnPositions(balanceByAsset: Map<string, number>): Promise<SyncResultInterface<SyncAccountInterface[]> | null> {
        const earnResult = await this.fetchEarnPositions();
        if (!earnResult.success) {
            return earnResult;
        }

        this.foldEarnPositions(balanceByAsset, earnResult.data);

        const lockedEarnResult = await this.fetchLockedEarnPositions();
        if (!lockedEarnResult.success) {
            return lockedEarnResult;
        }

        this.foldLockedEarnPositions(balanceByAsset, lockedEarnResult.data);

        return null;
    }

    private buildSpotBalanceMap(balances: BinanceAssetBalanceApiInterface[]): Map<string, number> {
        const balanceByAsset = new Map<string, number>();
        for (const balance of balances) {
            const total = this.computeRawTotalBalance(balance);
            if (isDefined(total) && total > 0) {
                balanceByAsset.set(balance.asset, total);
            }
        }

        return balanceByAsset;
    }

    private foldEarnPositions(balanceByAsset: Map<string, number>, positions: BinanceEarnPositionApiInterface[]): void {
        for (const position of positions) {
            const asset = this.stripEarnPrefix(position.asset);
            const quantity = binanceMapper.parseBinanceAmount(position.totalAmount);
            if (isDefined(quantity) && quantity > 0) {
                balanceByAsset.set(asset, (balanceByAsset.get(asset) ?? 0) + quantity);
            }
        }
    }

    private foldLockedEarnPositions(balanceByAsset: Map<string, number>, positions: BinanceLockedEarnPositionApiInterface[]): void {
        for (const position of positions) {
            const quantity = binanceMapper.parseBinanceAmount(position.amount);
            if (isDefined(quantity) && quantity > 0) {
                balanceByAsset.set(position.asset, (balanceByAsset.get(position.asset) ?? 0) + quantity);
            }
        }
    }

    private stripEarnPrefix(asset: string): string {
        return asset.startsWith(EARN_LD_PREFIX) ? asset.slice(EARN_LD_PREFIX.length) : asset;
    }

    private buildSpotAccounts(balanceByAsset: Map<string, number>): SyncAccountInterface[] {
        const accounts: SyncAccountInterface[] = [];
        for (const [asset, total] of balanceByAsset) {
            if (total * MICRO_UNITS_PRECISION <= Number.MAX_SAFE_INTEGER) {
                accounts.push(binanceMapper.mapBalanceToAccount(asset, BinanceWalletEnum.SPOT, total));
            } else {
                syncLogger.log('binance:earn:fold-overflow-park', { asset, total });
            }
        }

        return accounts;
    }

    private async fetchEarnPositions(): Promise<SyncResultInterface<BinanceEarnPositionApiInterface[]>> {
        return this.fetchEarnPositionPages(current => this.fetchEarnPositionPage(current));
    }

    private async fetchEarnPositionPage(current: number): Promise<SyncResultInterface<BinanceEarnPositionApiInterface[]>> {
        const result = await this.signedRequest(EARN_POSITION_ENDPOINT, 'GET', { current, size: EARN_PAGE_SIZE });
        if (!result.success) {
            return result;
        }

        const parsed = BinanceEarnPositionListApiSchema.safeParse(result.data);
        if (!parsed.success) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        return this.success(parsed.data.rows);
    }

    private async fetchLockedEarnPositions(): Promise<SyncResultInterface<BinanceLockedEarnPositionApiInterface[]>> {
        return this.fetchEarnPositionPages(current => this.fetchLockedEarnPositionPage(current));
    }

    private async fetchLockedEarnPositionPage(current: number): Promise<SyncResultInterface<BinanceLockedEarnPositionApiInterface[]>> {
        const result = await this.signedRequest(LOCKED_EARN_POSITION_ENDPOINT, 'GET', { current, size: EARN_PAGE_SIZE });
        if (!result.success) {
            return result;
        }

        const parsed = BinanceLockedEarnPositionListApiSchema.safeParse(result.data);
        if (!parsed.success) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        return this.success(parsed.data.rows);
    }

    private fetchEarnPositionPages<T>(
        fetchPage: (current: number) => Promise<SyncResultInterface<T[]>>
    ): Promise<SyncResultInterface<T[]>> {
        const positions: T[] = [];

        return this.fetchNextEarnPositionPage(fetchPage, 1, positions);
    }

    private fetchNextEarnPositionPage<T>(
        fetchPage: (current: number) => Promise<SyncResultInterface<T[]>>,
        current: number,
        positions: T[]
    ): Promise<SyncResultInterface<T[]>> {
        return fetchPage(current).then(pageResult => {
            if (!pageResult.success) {
                return pageResult;
            }

            positions.push(...pageResult.data);

            return pageResult.data.length === EARN_PAGE_SIZE
                ? this.fetchNextEarnPositionPage(fetchPage, current + 1, positions)
                : this.success(positions);
        });
    }

    private async fetchWalletBalances(wallet: BinanceWalletEnum): Promise<SyncResultInterface<SyncAccountInterface[]>> {
        const endpoint = wallet === BinanceWalletEnum.SPOT ? SPOT_BALANCE_ENDPOINT : FUNDING_BALANCE_ENDPOINT;
        const balancesResult = await this.fetchBalances(endpoint);
        if (!balancesResult.success) {
            return balancesResult;
        }

        const accounts = balancesResult.data.map(balance => this.mapBalance(balance, wallet)).filter(isDefined);

        return this.success(accounts);
    }

    private async fetchBalances(endpoint: string): Promise<SyncResultInterface<BinanceAssetBalanceApiInterface[]>> {
        const result = await this.signedRequest(endpoint, 'POST');
        if (!result.success) {
            return result;
        }

        const parsed = BinanceAssetBalanceListApiSchema.safeParse(result.data);
        if (!parsed.success) {
            return this.failure(SyncError.invalidResponse(this.provider));
        }

        return this.success(parsed.data);
    }

    private computeRawTotalBalance(balance: BinanceAssetBalanceApiInterface): number | null {
        const free = binanceMapper.parseBinanceAmount(balance.free);
        const locked = binanceMapper.parseBinanceAmount(balance.locked);
        if (!isDefined(free) || !isDefined(locked)) {
            return null;
        }

        return free + locked;
    }

    private mapBalance(balance: BinanceAssetBalanceApiInterface, wallet: BinanceWalletEnum): SyncAccountInterface | null {
        const totalBalance = this.computeTotalBalance(balance);
        if (!isDefined(totalBalance) || totalBalance <= 0) {
            return null;
        }

        return binanceMapper.mapBalanceToAccount(balance.asset, wallet, totalBalance);
    }

    private computeTotalBalance(balance: BinanceAssetBalanceApiInterface): number | null {
        const total = this.computeRawTotalBalance(balance);
        if (!isDefined(total)) {
            return null;
        }

        return total * MICRO_UNITS_PRECISION > Number.MAX_SAFE_INTEGER ? null : total;
    }

    private async signedRequest(
        endpoint: string,
        method: 'GET' | 'POST',
        params: Record<string, string | number> = {}
    ): Promise<SyncResultInterface<unknown>> {
        await this.throttle.waitIfNeeded();

        const timestamp = await this.resolveTimestamp();
        const baseParams = { ...params, recvWindow: SIGNATURE_RECV_WINDOW_MS, timestamp };
        const query = Object.entries(baseParams)
            .map(([key, value]) => `${key}=${String(value)}`)
            .join('&');
        const signature = this.sign(query);
        const signedEndpoint = `${endpoint}?${query}&signature=${signature}`;

        return this.fetchJson<unknown>(signedEndpoint, { method });
    }

    private async resolveTimestamp(): Promise<number> {
        if (!isDefined(this.serverTimeOffsetMs)) {
            await this.syncServerTime();
        }

        return Date.now() + (this.serverTimeOffsetMs ?? 0);
    }

    private async syncServerTime(): Promise<void> {
        const result = await this.fetchJson<unknown>(SERVER_TIME_ENDPOINT);
        if (!result.success) {
            this.serverTimeOffsetMs = 0;

            return;
        }

        const parsed = BinanceServerTimeApiSchema.safeParse(result.data);
        this.serverTimeOffsetMs = parsed.success ? parsed.data.serverTime - Date.now() : 0;
    }

    private sign(query: string): string {
        return bytesToHex(hmac(sha256, utf8ToBytes(this.credentials.apiSecret), utf8ToBytes(query)));
    }

    private static parseCredentials(token: string): BinanceCredentialsInterface {
        try {
            return BinanceCredentialsSchema.parse(JSON.parse(token));
        } catch (error) {
            throw new SyncError(SyncErrorCodeEnum.INVALID_TOKEN, 'Invalid Binance credentials', SyncProviderEnum.BINANCE, error);
        }
    }
}
