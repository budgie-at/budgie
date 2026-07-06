import {
    AccountTypeEnum,
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    ExternalSourceEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { Log, getLogger } from '@budgie/logger';
import {
    BINANCE_ASSET_ALIAS,
    BINANCE_RATE_LIMIT_MS,
    BinanceCredentialsSchema,
    BinanceSignedClient,
    SyncError,
    SyncErrorCodeEnum,
    binanceMapper,
    decodeBinanceAccountId
} from '@budgie/sync';
import { getUnixTime, subDays, subYears } from 'date-fns';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { accountService } from '../../account/service/account.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { BINANCE_SYNC_TASK } from '../constant/binance-sync-task.constant';
import { BINANCE_TRANSFER_LOOKBACK_YEARS } from '../constant/binance-transfer-lookback-years.constant';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { BinanceResolvableAccountInterface } from '../interface/binance-resolvable-account.interface';
import { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { AbstractPollingSyncService } from './abstract-polling-sync.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';

import type {
    AccountEntityInterface,
    InstrumentEntityInterface,
    SyncEntityInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface
} from '@budgie/contracts';
import type {
    BinanceTransferInterface,
    SyncAccountInterface,
    SyncBatchResultInterface,
    SyncResultInterface,
    SyncTransactionInterface
} from '@budgie/sync';

const logger = getLogger('AppBinanceSyncService');

class AppBinanceSyncService extends AbstractPollingSyncService {
    private static readonly TRANSFER_CHUNK_SIZE = 50;
    private static readonly SOURCE_INPUT_YIELD_INTERVAL = 50;
    private static readonly FORWARD_OVERLAP_DAYS = 1;
    private static readonly FEE_ENTRY_EXTERNAL_ID_SUFFIX = ':fee';
    private static readonly MILLISECONDS_PER_SECOND = 1000;

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
    async setupAccountSyncBatch(token: string, externalIds: string[]): Promise<number> {
        const exchangeAccounts = await this.fetchExchangeAccounts(token);
        const instruments = await instrumentRepository.getAll();
        const resolvableAccounts = exchangeAccounts
            .filter(exchangeAccount => externalIds.includes(exchangeAccount.id))
            .map(exchangeAccount => this.resolveAccountInstrumentId(exchangeAccount, instruments))
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
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        const changedCount = await this.runSyncPhases(sync, account.externalId);
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

    protected override generateAccountTitle(account: SyncAccountInterface): string {
        if (isNotEmptyString(account.title)) {
            return account.title;
        }

        return super.generateAccountTitle(account);
    }

    protected override accountIcon(): UserIconNameEnum {
        return UserIconNameEnum.Bitcoin;
    }

    private async runSyncPhases(sync: SyncEntityInterface, externalAccountId: string): Promise<number> {
        let changedCount = 0;
        try {
            changedCount += await this.processSources(sync);
            await microPause();
            changedCount += await this.processTransfers(sync, externalAccountId);
            await microPause();

            return changedCount;
        } catch (error) {
            if (!this.isDeadlineDeferral(error)) {
                throw error;
            }
            this.runDeferred = true;

            return changedCount;
        }
    }

    private async fetchExchangeAccounts(token: string): Promise<SyncAccountInterface[]> {
        if (isDefined(this.runExchangeAccounts) && this.runClientToken === token) {
            return this.runExchangeAccounts;
        }

        const result = await this.getRunSignedClient(token).getAccounts();
        if (!result.success) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error message, never user-facing
            throw new Error(`Failed to fetch accounts: ${result.error.code} ${result.error.message}`);
        }
        this.runExchangeAccounts = result.data;

        return result.data;
    }

    private async setupResolvedAccount(resolvableAccount: BinanceResolvableAccountInterface, token: string): Promise<void> {
        const account = await this.getOrCreateAccount(resolvableAccount.exchangeAccount, resolvableAccount.instrumentId);
        await this.anchorAccountBalance(account.id, resolvableAccount.exchangeAccount.balance);
        await this.createOrUpdateSync(account.id, token);
    }

    private async processTransfers(sync: SyncEntityInterface, externalAccountId: string): Promise<number> {
        if (this.transfersSyncedThisRun) {
            return 0;
        }
        this.transfersSyncedThisRun = true;

        const transfers = await this.fetchTransferBatch(sync, externalAccountId);
        if (!isNotEmptyArray(transfers)) {
            return 0;
        }

        const existingIds = await transactionService.findByExternalSource(this.provider);
        const newTransfers = transfers.filter(transfer => !existingIds.has(transfer.externalId));
        if (!isNotEmptyArray(newTransfers)) {
            return 0;
        }

        return this.createSyncedTransfers(newTransfers, sync.token);
    }

    private async processSources(sync: SyncEntityInterface): Promise<number> {
        if (this.sourcesSyncedThisRun) {
            return 0;
        }

        const client = this.getRunSignedClient(sync.token);
        const fromUnixTime = await this.resolveSourceWindowStart(sync);

        let createdCount = 0;
        createdCount += await this.commitSourceType(sync.token, () => client.getC2cTransactions(fromUnixTime));
        createdCount += await this.commitSourceType(sync.token, () => client.getEarnTransactions(fromUnixTime));
        createdCount += await this.commitSourceType(sync.token, () => client.getCapitalTransactions(fromUnixTime));
        createdCount += await this.commitSourceType(sync.token, () => client.getFiatTransactions(fromUnixTime));
        this.sourcesSyncedThisRun = true;

        return createdCount;
    }

    private async commitSourceType(
        token: string,
        fetchSourceType: () => Promise<SyncResultInterface<SyncTransactionInterface[]>>
    ): Promise<number> {
        const transactions = await this.resolveSourceTransactions(fetchSourceType);
        if (!isNotEmptyArray(transactions)) {
            return 0;
        }

        const existingIds = await transactionService.findByExternalSource(this.provider);
        const newTransactions = transactions.filter(sourceTransaction => !existingIds.has(sourceTransaction.id));
        if (!isNotEmptyArray(newTransactions)) {
            return 0;
        }

        return this.createSyncedSources(newTransactions, token);
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

    private async fetchTransferBatch(sync: SyncEntityInterface, externalAccountId: string): Promise<BinanceTransferInterface[]> {
        const client = this.getRunSignedClient(sync.token);
        const from = await this.resolveTransferWindowStart(sync);
        const result = await client.getTransfers(externalAccountId, getUnixTime(from));

        if (result.success) {
            return result.data;
        }

        // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error message, never user-facing
        throw new Error(`Failed to fetch transfers ${getErrorMessage(result.error)}`);
    }

    private async createSyncedTransfers(transfers: BinanceTransferInterface[], token: string): Promise<number> {
        const resolveAccount = await this.buildRunAccountResolver(token);
        const inputs = await this.collectTransferInputs(transfers, resolveAccount);

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

    private async collectTransferInputs(
        transfers: BinanceTransferInterface[],
        resolveAccount: (codecAccountId: string) => Promise<AccountEntityInterface | null>
    ): Promise<TransactionCreateInputInterface[]> {
        const inputs: TransactionCreateInputInterface[] = [];
        for (const transfer of transfers) {
            // eslint-disable-next-line no-await-in-loop -- Account resolution is sequential per transfer
            const input = await this.mapTransferToCreateInput(transfer, resolveAccount);
            if (isDefined(input)) {
                inputs.push(input);
            } else {
                logger.log('createSyncedTransfers:skip-parked-leg', { externalId: transfer.externalId });
            }
        }

        return inputs;
    }

    private chunkTransferInputs(inputs: TransactionCreateInputInterface[]): TransactionCreateInputInterface[][] {
        const chunks: TransactionCreateInputInterface[][] = [];
        for (let index = 0; index < inputs.length; index += AppBinanceSyncService.TRANSFER_CHUNK_SIZE) {
            chunks.push(inputs.slice(index, index + AppBinanceSyncService.TRANSFER_CHUNK_SIZE));
        }

        return chunks;
    }

    private async mapTransferToCreateInput(
        transfer: BinanceTransferInterface,
        resolveAccount: (codecAccountId: string) => Promise<AccountEntityInterface | null>
    ): Promise<TransactionCreateInputInterface | null> {
        const fromAccount = await resolveAccount(transfer.fromAssetAccountId);
        const toAccount = await resolveAccount(transfer.toAssetAccountId);
        if (!isDefined(fromAccount) || !isDefined(toAccount)) {
            return null;
        }

        const feeAccount = isDefined(transfer.feeAssetAccountId) ? await resolveAccount(transfer.feeAssetAccountId) : null;
        const entries = [
            this.buildTransferEntry(fromAccount.id, TransactionEntryTypeEnum.CREDIT, transfer.fromAmount, transfer.externalId),
            this.buildTransferEntry(toAccount.id, TransactionEntryTypeEnum.DEBIT, transfer.toAmount, transfer.externalId)
        ];
        if (isPositiveNumber(transfer.feeAmount)) {
            entries.push({
                ...this.buildTransferEntry(
                    feeAccount?.id ?? fromAccount.id,
                    TransactionEntryTypeEnum.FEE,
                    transfer.feeAmount,
                    `${transfer.externalId}${AppBinanceSyncService.FEE_ENTRY_EXTERNAL_ID_SUFFIX}`
                ),
                categoryId: BANK_FEE_CATEGORY_ID,
                categorySource: CategorySourceEnum.FEE
            });
        }

        return {
            amount: transfer.fromAmount,
            title: transfer.description,
            comment: '',
            type: TransactionTypeEnum.TRANSFER,
            exchangeRate: 1,
            operatedAt: new Date(transfer.time * AppBinanceSyncService.MILLISECONDS_PER_SECOND),
            externalId: transfer.externalId,
            updatedBy: null,
            externalSource: ExternalSourceEnum.BINANCE,
            fromAccountId: fromAccount.id,
            toAccountId: toAccount.id,
            tagIds: [],
            entries
        };
    }

    private buildTransferEntry(
        accountId: number,
        type: TransactionEntryTypeEnum,
        amount: number,
        externalId: string
    ): TransactionEntryCreateInputInterface {
        return {
            accountId,
            type,
            amount,
            categoryId: null,
            categorySource: CategorySourceEnum.USER,
            mccCategoryId: null,
            externalId,
            exchangeRate: 1,
            toIban: null
        };
    }

    private async anchorAllBalances(token: string): Promise<number> {
        const exchangeAccounts = await this.fetchExchangeAccounts(token);
        const balanceByExternalId = new Map(exchangeAccounts.map(exchangeAccount => [exchangeAccount.id, exchangeAccount.balance]));
        const accounts = await accountRepository.findByExternalSource(this.provider);

        let anchoredCount = 0;
        for (const account of accounts) {
            const balance = isNotEmptyString(account.externalId) ? (balanceByExternalId.get(account.externalId) ?? 0) : 0;
            // eslint-disable-next-line no-await-in-loop -- Balance anchors persist sequentially per account
            await this.anchorAccountBalance(account.id, balance);
            anchoredCount += 1;
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
        return error instanceof SyncError && error.code === SyncErrorCodeEnum.RATE_LIMITED;
    }

    private async resolveSourceWindowStart(sync: SyncEntityInterface): Promise<number> {
        if (isDefined(sync.forwardSyncedAt)) {
            return getUnixTime(subDays(sync.forwardSyncedAt, AppBinanceSyncService.FORWARD_OVERLAP_DAYS));
        }

        const earliestTransactionTime = await transactionService.getEarliestTransactionTimeByExternalSource(this.provider);

        return getUnixTime(earliestTransactionTime ?? subYears(new Date(), BINANCE_TRANSFER_LOOKBACK_YEARS));
    }

    private async resolveTransferWindowStart(sync: SyncEntityInterface): Promise<Date> {
        if (isDefined(sync.forwardSyncedAt)) {
            return subDays(sync.forwardSyncedAt, AppBinanceSyncService.FORWARD_OVERLAP_DAYS);
        }

        const earliestTransactionTime = await transactionService.getEarliestTransactionTimeByAccountId(sync.accountId);

        return earliestTransactionTime ?? sync.backwardSyncedAt ?? subYears(new Date(), BINANCE_TRANSFER_LOOKBACK_YEARS);
    }

    private async resolveSourceTransactions(
        fetchSourceType: () => Promise<SyncResultInterface<SyncTransactionInterface[]>>
    ): Promise<SyncTransactionInterface[]> {
        const result = await fetchSourceType();
        if (result.success) {
            return result.data;
        }

        // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error message, never user-facing
        throw new Error(`Failed to fetch sources ${getErrorMessage(result.error)}`);
    }

    private async buildSourceCreateInput(
        transaction: SyncTransactionInterface,
        resolveAccount: (codecAccountId: string) => Promise<AccountEntityInterface | null>
    ): Promise<TransactionCreateInputInterface | null> {
        const account = await resolveAccount(transaction.accountId);
        if (!isDefined(account)) {
            logger.log('createSyncedSources:skip-parked-source', { externalId: transaction.id, accountId: transaction.accountId });

            return null;
        }

        return mapBankTransactionToCreateInput(transaction, account.id, null, this.provider);
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

            const exchangeAccount = exchangeAccounts.get(codecAccountId) ?? this.buildExchangeAccountFromCodec(codecAccountId);
            if (!isDefined(exchangeAccount)) {
                return null;
            }

            const instrument = this.resolveInstrument(exchangeAccount, await instrumentsPromise);
            if (!isDefined(instrument)) {
                return null;
            }

            return this.getOrCreateAccount(exchangeAccount, instrument.id);
        };
    }

    private buildExchangeAccountFromCodec(codecAccountId: string): SyncAccountInterface | null {
        const decoded = decodeBinanceAccountId(codecAccountId);
        if (!isDefined(decoded)) {
            return null;
        }

        return binanceMapper.mapBalanceToAccount(decoded.asset, decoded.wallet, 0);
    }

    private resolveInstrument(
        exchangeAccount: SyncAccountInterface,
        instruments: InstrumentEntityInterface[]
    ): InstrumentEntityInterface | null {
        const instrumentCode = this.resolveInstrumentCode(exchangeAccount.currencyCode);

        return instruments.find(instrument => instrument.code === instrumentCode) ?? null;
    }

    private resolveInstrumentCode(asset: string): string {
        return BINANCE_ASSET_ALIAS[asset] ?? asset;
    }

    private resolveAccountInstrumentId(
        exchangeAccount: SyncAccountInterface,
        instruments: InstrumentEntityInterface[]
    ): BinanceResolvableAccountInterface | null {
        const instrument = this.resolveInstrument(exchangeAccount, instruments);

        return isDefined(instrument) ? { exchangeAccount, instrumentId: instrument.id } : null;
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
