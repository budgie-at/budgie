import { P2P_ORDER_EXTERNAL_ID_MARKER, consolidationScopeService } from '@budgie/consolidation';
import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import {
    BINANCE_RATE_LIMIT_MS,
    BinanceCredentialsSchema,
    BinanceSignedClient,
    SyncAccountBalanceStateEnum,
    SyncError,
    SyncErrorCodeEnum,
    SyncTransactionTypeEnum,
    binanceMapper,
    decodeBinanceAccountId
} from '@budgie/sync';
import { getUnixTime, subDays, subYears } from 'date-fns';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository, instrumentRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { accountService } from '../../account/service/account.service';
import { importedTransactionEntryUpdateService } from '../../transaction/service/imported-transaction-entry-update.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { BINANCE_SYNC_TASK } from '../constant/binance-sync-task.constant';
import { BINANCE_TRANSFER_LOOKBACK_YEARS } from '../constant/binance-transfer-lookback-years.constant';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { BinanceResolvableAccountInterface } from '../interface/binance-resolvable-account.interface';
import { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import { BinanceTransferInputMapper } from '../mapper/binance-transfer-input.mapper';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { AbstractPollingSyncService } from './abstract-polling-sync.service';
import { binanceAssetCodeService } from './binance-asset-code.service';
import { binanceSourceQuoteService } from './binance-source-quote.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';

import type {
    AccountEntityInterface,
    InstrumentEntityInterface,
    SyncEntityInterface,
    TransactionCreateInputInterface
} from '@budgie/contracts';
import type {
    BinanceTransferInterface,
    SyncAccountInterface,
    SyncBatchResultInterface,
    SyncResultInterface,
    SyncTransactionInterface
} from '@budgie/sync';

class AppBinanceSyncService extends AbstractPollingSyncService {
    private static readonly TRANSFER_CHUNK_SIZE = 50;
    private static readonly SOURCE_INPUT_YIELD_INTERVAL = 50;
    private static readonly FORWARD_OVERLAP_DAYS = 1;
    private static readonly FIAT_REFRESH_INTERVAL_MS = 23 * 60 * 60 * 1000;
    protected readonly provider = ExternalSourceEnum.BINANCE;
    // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
    protected readonly providerTitle = 'Binance';
    protected readonly accountType = AccountTypeEnum.CRYPTO_SYNC;
    protected readonly rateLimitMs = BINANCE_RATE_LIMIT_MS;
    protected readonly backgroundTaskName = BINANCE_SYNC_TASK;

    private transfersSyncedThisRun = false;
    private sourcesSyncedThisRun = false;
    private balancesAnchoredThisRun = false;
    private runSignedClient: BinanceSignedClient | null = null;
    private runClientToken: string | null = null;
    private runExchangeAccounts: SyncAccountInterface[] | null = null;
    private fiatSyncedAtMs: number | null = null;

    @Log(
        token => `enter keyLen=${token.length}`,
        (result, token) =>
            `done keyLen=${token.length} externalIds=${result.map(preview => preview.externalId).join(',')} parkedCount=${result.filter(preview => preview.isParked).length}`,
        (error, token) => `throw keyLen=${token.length} error=${getErrorMessage(error)}`
    )
    async fetchAccountsPreview(token: string): Promise<SyncAccountPreviewInterface[]> {
        const exchangeAccounts = await this.fetchExchangeAccounts(token);
        const instruments = await instrumentRepository.getAll();

        return this.mapAccountsToPreview(
            exchangeAccounts,
            exchangeAccount => !isDefined(this.resolveInstrument(exchangeAccount, instruments))
        );
    }

    @Log(
        (token, externalIds) => `enter keyLen=${token.length} externalIds=${externalIds.join(',')}`,
        (result, token, externalIds) => `done keyLen=${token.length} externalIds=${externalIds.join(',')} createdCount=${result}`,
        (error, token, externalIds) => `throw keyLen=${token.length} externalIds=${externalIds.join(',')} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async setupAccountSyncBatch(token: string, externalIds: string[]): Promise<number> {
        const exchangeAccounts = await this.fetchExchangeAccounts(token);
        const instruments = await instrumentRepository.getAll();
        const resolvableAccounts = exchangeAccounts
            .filter(exchangeAccount => externalIds.includes(exchangeAccount.id))
            .map(exchangeAccount => {
                const instrument = this.resolveInstrument(exchangeAccount, instruments);

                return isDefined(instrument) ? { exchangeAccount, instrumentId: instrument.id } : null;
            })
            .filter(isDefined);

        let createdCount = 0;
        for (const resolvableAccount of resolvableAccounts) {
            // eslint-disable-next-line no-await-in-loop -- Account setup persists sequentially per resolved exchange account
            await this.setupResolvedAccount(resolvableAccount, token);
            createdCount += 1;
        }

        if (isPositiveNumber(createdCount)) {
            void this.registerBackgroundTask();
            void this.sync();
        }

        return createdCount;
    }

    @Log(
        token => `enter keyLen=${token.length}`,
        (_result, token) => `done keyLen=${token.length}`,
        (error, token) => `throw keyLen=${token.length} error=${getErrorMessage(error)}`
    )
    protected override async beforeProcessRun(firstSyncToken: string): Promise<void> {
        if (!this.balancesAnchoredThisRun) {
            this.balancesAnchoredThisRun = true;
            await this.anchorAllBalances(firstSyncToken);
        }
    }

    @Log(
        sync => `enter syncId=${sync.id} mode=${sync.mode}`,
        (result, sync) =>
            `done syncId=${sync.id} mode=${sync.mode} count=${result.transactions.length} completed=${String(result.completed)}`,
        (error, sync) => `throw syncId=${sync.id} mode=${sync.mode} error=${getErrorMessage(error)}`
    )
    protected async executeSyncBatch(sync: SyncEntityInterface): Promise<SyncBatchResultInterface> {
        const account = await accountRepository.findById(sync.accountId);
        const externalAccountId = account?.externalId ?? null;
        if (!isNotEmptyString(externalAccountId)) {
            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        const token = await this.resolveSyncToken(sync);
        const changedCount = await this.runSyncPhases(sync, externalAccountId, token);
        if (isPositiveNumber(changedCount)) {
            await transactionService.updateAllBalances();
            transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.BINANCE_SYNC);
        }

        const progressDate = this.runDeferred ? (sync.backwardSyncFromAt ?? sync.forwardSyncFromAt ?? new Date()) : new Date();

        return {
            transactions: [],
            transactionCount: changedCount,
            nextTo: progressDate,
            nextFrom: progressDate,
            completed: !this.runDeferred
        };
    }

    @Log('enter', result => `done changedCount=${result}`, error => `throw error=${getErrorMessage(error)}`)
    private async runSyncPhases(sync: SyncEntityInterface, externalAccountId: string, token: string): Promise<number> {
        let changedCount = 0;
        try {
            changedCount += await this.processSources(sync, token);
            await microPause();
            changedCount += await this.processTransfers(sync, externalAccountId, token);
            await microPause();
            changedCount += await this.processFiatSource(sync, token);

            return changedCount;
        } catch (error) {
            if (!this.isDeadlineDeferral(error)) {
                throw error;
            }
            this.runDeferred = true;

            return changedCount;
        }
    }

    protected override validateToken(token: string): void {
        BinanceCredentialsSchema.parse(JSON.parse(token));
    }

    protected override async beforeSyncRun(): Promise<void> {
        this.resetRunState();
    }

    protected override async afterSyncRun(): Promise<void> {
        this.resetRunState();
    }

    protected override isRunWorkComplete(): boolean {
        return this.sourcesSyncedThisRun && this.transfersSyncedThisRun;
    }

    protected override isRetryableError(error: unknown): boolean {
        if (!(error instanceof SyncError)) {
            return true;
        }

        return (
            error.code === SyncErrorCodeEnum.NETWORK_ERROR ||
            error.code === SyncErrorCodeEnum.RATE_LIMITED ||
            error.code === SyncErrorCodeEnum.UNKNOWN
        );
    }

    protected override isCredentialWideError(error: unknown): boolean {
        return error instanceof SyncError && error.code === SyncErrorCodeEnum.UNAUTHORIZED;
    }

    protected override generateAccountTitle(account: SyncAccountInterface): string {
        return isNotEmptyString(account.title) ? account.title : super.generateAccountTitle(account);
    }

    protected override accountIcon(): UserIconNameEnum {
        return UserIconNameEnum.Bitcoin;
    }

    private async fetchExchangeAccounts(token: string): Promise<SyncAccountInterface[]> {
        if (isDefined(this.runExchangeAccounts) && this.runClientToken === token) {
            return this.runExchangeAccounts;
        }

        const result = await this.getRunSignedClient(token).getAccounts();
        if (!result.success) {
            throw SyncError.from(result.error);
        }
        this.runExchangeAccounts = result.data;

        return result.data;
    }

    private async setupResolvedAccount(resolvableAccount: BinanceResolvableAccountInterface, token: string): Promise<void> {
        const account = await this.getOrCreateAccount(resolvableAccount.exchangeAccount, resolvableAccount.instrumentId);
        if (resolvableAccount.exchangeAccount.balanceState === SyncAccountBalanceStateEnum.REPRESENTABLE) {
            await this.anchorAccountBalance(account.id, resolvableAccount.exchangeAccount.balance);
        }
        await this.createOrUpdateSync(account.id, token);
    }

    private async processTransfers(sync: SyncEntityInterface, externalAccountId: string, token: string): Promise<number> {
        if (this.transfersSyncedThisRun) {
            return 0;
        }
        this.transfersSyncedThisRun = true;

        const transfers = await this.fetchTransferBatch(sync, externalAccountId, token);
        if (!isNotEmptyArray(transfers)) {
            return 0;
        }

        const existingIds = await transactionService.findByExternalSource(this.provider);
        const newTransfers = transfers.filter(transfer => !existingIds.has(transfer.externalId));
        if (!isNotEmptyArray(newTransfers)) {
            return 0;
        }

        return this.createSyncedTransfers(newTransfers, token);
    }

    private async processSources(sync: SyncEntityInterface, token: string): Promise<number> {
        if (this.sourcesSyncedThisRun) {
            return 0;
        }

        const client = this.getRunSignedClient(token);
        const fromUnixTime = getUnixTime(this.resolveWindowStart(sync));

        let createdCount = 0;
        createdCount += await this.commitSourceType(token, () => client.getC2cTransactions(fromUnixTime), true);
        createdCount += await this.commitSourceType(token, () => client.getEarnTransactions(fromUnixTime), false);
        createdCount += await this.commitSourceType(token, () => client.getCapitalTransactions(fromUnixTime), false);

        return createdCount;
    }

    private async processFiatSource(sync: SyncEntityInterface, token: string): Promise<number> {
        if (this.sourcesSyncedThisRun) {
            return 0;
        }

        let createdCount = 0;
        if (this.shouldRefreshFiatHistory()) {
            const client = this.getRunSignedClient(token);
            const fromUnixTime = getUnixTime(this.resolveWindowStart(sync));
            createdCount += await this.commitSourceType(token, () => client.getFiatTransactions(fromUnixTime), false);
            this.fiatSyncedAtMs = Date.now();
        }
        this.sourcesSyncedThisRun = true;

        return createdCount;
    }

    private shouldRefreshFiatHistory(): boolean {
        return !isDefined(this.fiatSyncedAtMs) || Date.now() - this.fiatSyncedAtMs >= AppBinanceSyncService.FIAT_REFRESH_INTERVAL_MS;
    }

    private async commitSourceType(
        token: string,
        fetchSourceType: () => Promise<SyncResultInterface<SyncTransactionInterface[]>>,
        enqueueExistingConsolidation: boolean
    ): Promise<number> {
        const transactions = await this.resolveSourceTransactions(fetchSourceType);
        if (!isNotEmptyArray(transactions)) {
            return 0;
        }

        const existingIdMap = await transactionService.findIdMapByExternalSource(this.provider);
        const existingTransactions = transactions.filter(sourceTransaction => existingIdMap.has(sourceTransaction.id));
        const reconciledCount = await this.reconcileSourceAccounts(existingTransactions, token, existingIdMap);
        if (enqueueExistingConsolidation) {
            await this.enqueueExistingSourceConsolidation(existingTransactions, existingIdMap);
        }

        const newTransactions = transactions.filter(sourceTransaction => !existingIdMap.has(sourceTransaction.id));
        if (!isNotEmptyArray(newTransactions)) {
            return reconciledCount;
        }

        return reconciledCount + (await this.createSyncedSources(newTransactions, token));
    }

    private async enqueueExistingSourceConsolidation(
        sourceTransactions: SyncTransactionInterface[],
        existingIdMap: ReadonlyMap<string, number>
    ): Promise<void> {
        const transactionIds = sourceTransactions
            .filter(transaction => transaction.id.includes(P2P_ORDER_EXTERNAL_ID_MARKER))
            .map(transaction => existingIdMap.get(transaction.id))
            .filter(isDefined);
        if (!isNotEmptyArray(transactionIds)) {
            return;
        }

        const transactions = await transactionRepository.findByIds(transactionIds);
        const consolidationScope = consolidationScopeService.buildFromTransactions(transactions);
        if (isDefined(consolidationScope)) {
            transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.BINANCE_SYNC, consolidationScope);
        }
    }

    private async reconcileSourceAccounts(
        transactions: SyncTransactionInterface[],
        token: string,
        existingIdMap: ReadonlyMap<string, number>
    ): Promise<number> {
        const resolveAccount = await this.buildRunAccountResolver(token);

        return transactions.reduce(
            (previousCount, transaction) =>
                previousCount.then(async count => count + (await this.reconcileSourceAccount(transaction, resolveAccount, existingIdMap))),
            Promise.resolve(0)
        );
    }

    private async reconcileSourceAccount(
        transaction: SyncTransactionInterface,
        resolveAccount: (codecAccountId: string) => Promise<AccountEntityInterface | null>,
        existingIdMap: ReadonlyMap<string, number>
    ): Promise<number> {
        const account = await resolveAccount(transaction.accountId);
        const transactionId = existingIdMap.get(transaction.id);
        if (isDefined(account) && isDefined(transactionId)) {
            const accountChanged = await transactionService.moveExternalEntryToAccount(
                transactionId,
                transaction.id,
                account.id,
                transaction.type === SyncTransactionTypeEnum.INCOME
            );
            const quote = await binanceSourceQuoteService.resolve(transaction);
            const quoteChanged =
                isDefined(quote) &&
                (await importedTransactionEntryUpdateService.updateExternalEntryQuote(transactionId, transaction.id, quote));

            return accountChanged || quoteChanged ? 1 : 0;
        }

        return 0;
    }

    private async createSyncedSources(transactions: SyncTransactionInterface[], token: string): Promise<number> {
        const resolveAccount = await this.buildRunAccountResolver(token);
        const inputs = await this.collectSourceInputs(transactions, resolveAccount);
        if (!isNotEmptyArray(inputs)) {
            return 0;
        }

        const created = await transactionService.bulkCreate(inputs);

        return created.length;
    }

    private async fetchTransferBatch(
        sync: SyncEntityInterface,
        externalAccountId: string,
        token: string
    ): Promise<BinanceTransferInterface[]> {
        const result = await this.getRunSignedClient(token).getTransfers(
            externalAccountId,
            getUnixTime(this.resolveWindowStart(sync)),
            null,
            await binanceAssetCodeService.resolveEligibleSoldOffBaseAssets(this.provider)
        );
        if (result.success) {
            return result.data;
        }
        throw SyncError.from(result.error);
    }

    private async createSyncedTransfers(transfers: BinanceTransferInterface[], token: string): Promise<number> {
        const resolveAccount = await this.buildRunAccountResolver(token);
        const inputs = await new BinanceTransferInputMapper(resolveAccount).map(transfers);

        let createdCount = 0;
        for (const chunk of this.chunkTransferInputs(inputs)) {
            // eslint-disable-next-line no-await-in-loop -- Chunks commit sequentially, each in its own short transaction
            const created = await transactionService.createSyncedTransfers(chunk);
            createdCount += created.length;
            // eslint-disable-next-line no-await-in-loop -- Yield to the JS loop between chunk transactions
            await microPause();
        }

        return createdCount;
    }

    private chunkTransferInputs(inputs: TransactionCreateInputInterface[]): TransactionCreateInputInterface[][] {
        const chunks: TransactionCreateInputInterface[][] = [];
        for (let index = 0; index < inputs.length; index += AppBinanceSyncService.TRANSFER_CHUNK_SIZE) {
            chunks.push(inputs.slice(index, index + AppBinanceSyncService.TRANSFER_CHUNK_SIZE));
        }

        return chunks;
    }

    private async anchorAllBalances(token: string): Promise<number> {
        const exchangeAccounts = await this.fetchExchangeAccounts(token);
        const exchangeAccountByExternalId = new Map(exchangeAccounts.map(exchangeAccount => [exchangeAccount.id, exchangeAccount]));
        const accounts = await accountRepository.findByExternalSource(this.provider);

        let anchoredCount = 0;
        for (const account of accounts) {
            const exchangeAccount = isNotEmptyString(account.externalId) ? exchangeAccountByExternalId.get(account.externalId) : null;
            if (!isDefined(exchangeAccount) || exchangeAccount.balanceState === SyncAccountBalanceStateEnum.REPRESENTABLE) {
                // eslint-disable-next-line no-await-in-loop -- Balance anchors persist sequentially per account
                await this.anchorAccountBalance(account.id, exchangeAccount?.balance ?? 0);
                anchoredCount += 1;
            }
        }

        return anchoredCount;
    }

    private resetRunState(): void {
        this.transfersSyncedThisRun = false;
        this.sourcesSyncedThisRun = false;
        this.balancesAnchoredThisRun = false;
        this.runSignedClient = null;
        this.runClientToken = null;
        this.runExchangeAccounts = null;
    }

    private isDeadlineDeferral(error: unknown): boolean {
        return error instanceof SyncError && error.code === SyncErrorCodeEnum.DEFERRED;
    }

    private resolveWindowStart(sync: SyncEntityInterface): Date {
        if (sync.mode === SyncModeEnum.BACKWARD) {
            return subYears(sync.backwardSyncFromAt ?? sync.forwardSyncFromAt ?? new Date(), BINANCE_TRANSFER_LOOKBACK_YEARS);
        }

        if (isDefined(sync.forwardSyncedAt)) {
            return subDays(sync.forwardSyncedAt, AppBinanceSyncService.FORWARD_OVERLAP_DAYS);
        }

        return subYears(sync.forwardSyncFromAt ?? new Date(), BINANCE_TRANSFER_LOOKBACK_YEARS);
    }

    private async resolveSourceTransactions(
        fetchSourceType: () => Promise<SyncResultInterface<SyncTransactionInterface[]>>
    ): Promise<SyncTransactionInterface[]> {
        const result = await fetchSourceType();
        if (result.success) {
            return result.data;
        }

        throw SyncError.from(result.error);
    }

    private async buildSourceCreateInput(
        transaction: SyncTransactionInterface,
        resolveAccount: (codecAccountId: string) => Promise<AccountEntityInterface | null>
    ): Promise<TransactionCreateInputInterface | null> {
        const account = await resolveAccount(transaction.accountId);
        if (!isDefined(account)) {
            return null;
        }

        const input = mapBankTransactionToCreateInput(transaction, account.id, null, this.provider);

        return binanceSourceQuoteService.applyToInput(input, transaction);
    }

    private async collectSourceInputs(
        transactions: SyncTransactionInterface[],
        resolveAccount: (codecAccountId: string) => Promise<AccountEntityInterface | null>
    ): Promise<TransactionCreateInputInterface[]> {
        const inputs: TransactionCreateInputInterface[] = [];
        for (const [index, transaction] of transactions.entries()) {
            if (isPositiveNumber(index) && index % AppBinanceSyncService.SOURCE_INPUT_YIELD_INTERVAL === 0) {
                // eslint-disable-next-line no-await-in-loop -- Yield to the JS loop between source-input batches
                await microPause();
            }
            // eslint-disable-next-line no-await-in-loop -- Account resolution is sequential per source transaction
            const input = await this.buildSourceCreateInput(transaction, resolveAccount);
            if (isDefined(input)) {
                inputs.push(input);
            }
        }

        return inputs;
    }

    private getRunSignedClient(token: string): BinanceSignedClient {
        if (!isDefined(this.runSignedClient) || this.runClientToken !== token) {
            this.runSignedClient = new BinanceSignedClient(token, this.runDeadlineAtMs);
            this.runClientToken = token;
            this.runExchangeAccounts = null;
        }

        return this.runSignedClient;
    }

    private async buildRunAccountResolver(token: string): Promise<(codecAccountId: string) => Promise<AccountEntityInterface | null>> {
        const exchangeAccounts = await this.fetchExchangeAccounts(token);

        return this.buildTransferAccountResolver(new Map(exchangeAccounts.map(exchangeAccount => [exchangeAccount.id, exchangeAccount])));
    }

    private buildTransferAccountResolver(
        exchangeAccounts: Map<string, SyncAccountInterface>
    ): (codecAccountId: string) => Promise<AccountEntityInterface | null> {
        const instrumentsPromise = instrumentRepository.getAll();

        return async (codecAccountId: string): Promise<AccountEntityInterface | null> => {
            const existingAccount = (await accountRepository.findByExternalIds([codecAccountId])).at(0);
            if (isDefined(existingAccount)) {
                return existingAccount;
            }

            let resolvedExchangeAccount = exchangeAccounts.get(codecAccountId);
            if (!isDefined(resolvedExchangeAccount)) {
                const decoded = decodeBinanceAccountId(codecAccountId);
                if (!isDefined(decoded)) {
                    return null;
                }
                resolvedExchangeAccount = binanceMapper.mapBalanceToAccount(decoded.asset, decoded.wallet, 0);
            }

            const instrument = this.resolveInstrument(resolvedExchangeAccount, await instrumentsPromise);

            return isDefined(instrument) ? this.getOrCreateAccount(resolvedExchangeAccount, instrument.id) : null;
        };
    }

    private resolveInstrument(
        exchangeAccount: SyncAccountInterface,
        instruments: InstrumentEntityInterface[]
    ): InstrumentEntityInterface | null {
        const instrumentCode = binanceAssetCodeService.resolveInstrumentCode(exchangeAccount.currencyCode);

        return instruments.find(instrument => instrument.code === instrumentCode) ?? null;
    }

    private async anchorAccountBalance(accountId: number, balance: number): Promise<void> {
        await accountBalanceRepository.upsert({ accountId, amount: convertToMicroUnits(balance), updatedAt: new Date() });
    }

    private async getOrCreateAccount(exchangeAccount: SyncAccountInterface, instrumentId: number): Promise<AccountEntityInterface> {
        const existingByExternalId = await accountRepository.findByExternalIds([exchangeAccount.id]);
        const existingAccount = existingByExternalId.at(0);
        if (isDefined(existingAccount)) {
            return existingAccount;
        }

        const input = this.mapAccountToCreateInput(exchangeAccount, instrumentId);
        const createdAccount = Object.values(await accountService.bulkCreate([input])).at(0);
        if (!isDefined(createdAccount)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error message, never user-facing
            throw new Error('Failed to create Binance account');
        }

        return createdAccount;
    }
}

export const binanceSyncService = new AppBinanceSyncService();
