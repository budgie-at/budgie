/* eslint-disable no-await-in-loop, max-lines -- Sync orchestration requires sequential awaits and the account-creation loop reads the running account count; the file owns one cohesive sync service */
import {
    BINANCE_RATE_LIMIT_MS,
    BankSyncErrorCodeEnum,
    BinanceCredentialsSchema,
    BinanceSignedClient,
    BinanceSyncService,
    binanceMapper,
    decodeBinanceAccountId
} from '@budgie/bank-sync';
import { BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Log, getLogger } from '@budgie/logger';
import { getUnixTime, subYears } from 'date-fns';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository, bankSyncRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { TWO_MINUTES_IN_SECONDS } from '../../account/constant/minutes-in-seconds.constant';
import { accountService } from '../../account/service/account.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { BINANCE_SYNC_TASK } from '../constant/binance-sync-task.constant';
import { BINANCE_TRANSFER_LOOKBACK_YEARS } from '../constant/binance-transfer-lookback-years.constant';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';
import { BinanceResolvableAccountInterface } from '../interface/binance-resolvable-account.interface';
import { applyBankSyncProgressUpdate } from '../util/apply-bank-sync-progress-update.util';
import { createOrUpdateBankSync } from '../util/create-or-update-bank-sync.util';
import { mapBankAccountToCreateInput } from '../util/map-bank-account-to-create-input.util';
import { mapBankAccountsToPreview } from '../util/map-bank-accounts-to-preview.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';
import { mapBinanceTransferToCreateInput } from '../util/map-binance-transfer-to-create-input.util';
import { resolveBinanceInstrumentCode } from '../util/resolve-binance-instrument-code.util';
import { runBankSyncLoop } from '../util/run-bank-sync-loop.util';

import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';

import type {
    BankAccountInterface,
    BankSyncBatchResultInterface,
    BankSyncResultInterface,
    BankTransactionInterface,
    BinanceTransferInterface
} from '@budgie/bank-sync';
import type {
    AccountEntityInterface,
    BankSyncEntityInterface,
    InstrumentEntityInterface,
    TransactionCreateInputInterface
} from '@budgie/contracts';

const logger = getLogger('AppBinanceSyncService');

class AppBinanceSyncService {
    private static readonly FORWARD_SYNC_STALE_THRESHOLD_MS = TWO_MINUTES_IN_SECONDS * 1000;
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 15;

    private readonly provider = ExternalSourceEnum.BINANCE;
    private isRunning = false;
    private transfersSyncedThisRun = false;
    private sourcesSyncedThisRun = false;
    private balancesAnchoredThisRun = false;
    private runSyncService: BinanceSyncService | null = null;
    private runSignedClient: BinanceSignedClient | null = null;
    private runClientToken: string | null = null;

    @Log('enter', result => `done result=${String(result)}`, error => `throw error=${getErrorMessage(error)}`)
    async sync(): Promise<BackgroundTask.BackgroundTaskResult> {
        if (this.isRunning) {
            logger.log('sync:skip', { reason: 'already-running' });

            return BackgroundTask.BackgroundTaskResult.Success;
        }
        this.isRunning = true;
        this.resetRunState();
        try {
            return await this.executeSyncLoop();
        } finally {
            this.isRunning = false;
        }
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(BINANCE_SYNC_TASK)) {
            await BackgroundTask.unregisterTaskAsync(BINANCE_SYNC_TASK);
        }
        await BackgroundTask.registerTaskAsync(BINANCE_SYNC_TASK, {
            minimumInterval: AppBinanceSyncService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
        });
    }

    @Log(
        token => `enter keyLen=${token.length}`,
        (result, token) =>
            `done keyLen=${token.length} externalIds=${result.map(preview => preview.externalId).join(',')} parkedCount=${result.filter(preview => preview.isParked).length}`,
        (error, token) => `throw keyLen=${token.length} error=${getErrorMessage(error)}`
    )
    async fetchAccountsPreview(token: string): Promise<BankAccountPreviewInterface[]> {
        const bankAccounts = await this.fetchBankAccounts(token);

        return this.mapAccountsToPreview(bankAccounts);
    }

    @Log(
        (token, externalIds) => `enter keyLen=${token.length} externalIds=${externalIds.join(',')}`,
        (result, token, externalIds) => `done keyLen=${token.length} externalIds=${externalIds.join(',')} createdCount=${result}`,
        (error, token, externalIds) => `throw keyLen=${token.length} externalIds=${externalIds.join(',')} error=${getErrorMessage(error)}`
    )
    async setupAccountSyncBatch(token: string, externalIds: string[]): Promise<number> {
        const bankAccounts = await this.fetchBankAccounts(token);
        const instruments = await instrumentRepository.getAll();
        const resolvableAccounts = bankAccounts
            .filter(bankAccount => externalIds.includes(bankAccount.id))
            .map(bankAccount => this.resolveAccountInstrumentId(bankAccount, instruments))
            .filter(isDefined);

        let createdCount = 0;
        for (const { bankAccount, instrumentId } of resolvableAccounts) {
            const account = await this.getOrCreateAccount(bankAccount, instrumentId);
            await this.anchorAccountBalance(account.id, bankAccount.balance);
            await createOrUpdateBankSync(account.id, token, this.provider);
            createdCount += 1;
        }

        return createdCount;
    }

    @Log(
        (accountId, token) => `enter accountId=${accountId} keyLen=${token.length}`,
        'done',
        (error, accountId, token) => `throw accountId=${accountId} keyLen=${token.length} error=${getErrorMessage(error)}`
    )
    async updateAccountToken(accountId: number, token: string): Promise<void> {
        const bankSync = await bankSyncRepository.getByAccountId(accountId);
        if (!isDefined(bankSync)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error('Bank sync not found');
        }

        BinanceCredentialsSchema.parse(JSON.parse(token));
        await bankSyncRepository.update(bankSync.id, { token, errorCount: 0, lastError: null });
    }

    @Log(
        (accountId, enabled) => `enter accountId=${accountId} enabled=${String(enabled)}`,
        'done',
        (error, accountId, enabled) => `throw accountId=${accountId} enabled=${String(enabled)} error=${getErrorMessage(error)}`
    )
    async setAccountSyncEnabled(accountId: number, enabled: boolean): Promise<void> {
        await bankSyncRepository.setEnabled(accountId, enabled);
    }

    @Log(
        token => `enter keyLen=${token.length}`,
        (result, token) => `done keyLen=${token.length} count=${result.length}`,
        (error, token) => `throw keyLen=${token.length} error=${getErrorMessage(error)}`
    )
    private async fetchBankAccounts(token: string): Promise<BankAccountInterface[]> {
        return this.getRunSyncService(token).syncAccounts();
    }

    @Log(
        accounts => `enter externalIds=${accounts.map(account => account.id).join(',')}`,
        result =>
            `done externalIds=${result.map(preview => preview.externalId).join(',')} parkedCount=${result.filter(preview => preview.isParked).length}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async mapAccountsToPreview(bankAccounts: BankAccountInterface[]): Promise<BankAccountPreviewInterface[]> {
        const instruments = await instrumentRepository.getAll();

        return mapBankAccountsToPreview(
            bankAccounts,
            this.provider,
            bankAccount => !isDefined(this.resolveInstrument(bankAccount, instruments))
        );
    }

    @Log('enter', result => `done result=${String(result)}`, error => `throw error=${getErrorMessage(error)}`)
    private async executeSyncLoop(): Promise<BackgroundTask.BackgroundTaskResult> {
        return runBankSyncLoop(
            this.provider,
            BINANCE_RATE_LIMIT_MS,
            () => this.processPendingSyncs(),
            async firstSyncToken => {
                if (!this.balancesAnchoredThisRun) {
                    this.balancesAnchoredThisRun = true;
                    await this.anchorAllBalances(firstSyncToken);
                }
            }
        );
    }

    @Log('enter', result => `done result=${String(result)}`, error => `throw error=${getErrorMessage(error)}`)
    private async processPendingSyncs(): Promise<BackgroundTask.BackgroundTaskResult> {
        const pendingSync = await this.getNextPendingSync();
        if (!isDefined(pendingSync)) {
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        const result = await this.executeSyncBatch(pendingSync);
        await this.updateSyncProgress(pendingSync, result);
        await microPause(BINANCE_RATE_LIMIT_MS);

        return await this.executeSyncLoop();
    }

    @Log('enter', result => `done found=${String(isDefined(result))}`, error => `throw error=${getErrorMessage(error)}`)
    private async getNextPendingSync(): Promise<BankSyncEntityInterface | null> {
        const backwardSyncs = await bankSyncRepository.getPendingBackwardSync(this.provider);
        if (isNotEmptyArray(backwardSyncs)) {
            await bankSyncRepository.setStatus(backwardSyncs[0].id, BankSyncStatusEnum.SYNCING);

            return backwardSyncs[0];
        }

        const forwardSyncs = await bankSyncRepository.getPendingForwardSync(
            this.provider,
            AppBinanceSyncService.FORWARD_SYNC_STALE_THRESHOLD_MS
        );
        if (isNotEmptyArray(forwardSyncs)) {
            await bankSyncRepository.setStatus(forwardSyncs[0].id, BankSyncStatusEnum.SYNCING);

            return forwardSyncs[0];
        }

        return null;
    }

    @Log(
        sync => `enter syncId=${sync.id} mode=${sync.mode}`,
        (result, sync) =>
            `done syncId=${sync.id} mode=${sync.mode} count=${result.transactions.length} completed=${String(result.completed)}`,
        (error, sync) => `throw syncId=${sync.id} mode=${sync.mode} error=${getErrorMessage(error)}`
    )
    private async executeSyncBatch(sync: BankSyncEntityInterface): Promise<BankSyncBatchResultInterface> {
        const account = await accountRepository.findById(sync.accountId);
        if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        const changedSourceCount = await this.processSources(sync);
        await microPause();
        const changedTransferCount = await this.processTransfers(sync, account.externalId);
        await microPause();

        if (isPositiveNumber(changedSourceCount + changedTransferCount)) {
            transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.BINANCE_SYNC);
        }

        const now = new Date();

        return { transactions: [], nextTo: now, nextFrom: now, completed: true };
    }

    @Log(
        (sync, externalAccountId) => `enter syncId=${sync.id} externalAccountId=${externalAccountId}`,
        (result, sync, externalAccountId) => `done syncId=${sync.id} externalAccountId=${externalAccountId} createdCount=${result}`,
        (error, sync, externalAccountId) => `throw syncId=${sync.id} externalAccountId=${externalAccountId} error=${getErrorMessage(error)}`
    )
    private async processTransfers(sync: BankSyncEntityInterface, externalAccountId: string): Promise<number> {
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

    @Log(
        sync => `enter syncId=${sync.id}`,
        (result, sync) => `done syncId=${sync.id} createdCount=${result}`,
        (error, sync) => `throw syncId=${sync.id} error=${getErrorMessage(error)}`
    )
    private async processSources(sync: BankSyncEntityInterface): Promise<number> {
        if (this.sourcesSyncedThisRun) {
            return 0;
        }

        const client = this.getRunSignedClient(sync.token);
        const fromUnixTime = await this.resolveSourceWindowStart();

        let createdCount = 0;
        createdCount += await this.commitSourceType(sync.token, () => client.getC2cTransactions(fromUnixTime));
        createdCount += await this.commitSourceType(sync.token, () => client.getEarnTransactions(fromUnixTime));
        createdCount += await this.commitSourceType(sync.token, () => client.getCapitalTransactions(fromUnixTime));
        createdCount += await this.commitSourceType(sync.token, () => client.getFiatTransactions(fromUnixTime));
        this.sourcesSyncedThisRun = true;

        return createdCount;
    }

    @Log(
        token => `enter keyLen=${token.length}`,
        (result, token) => `done keyLen=${token.length} createdCount=${result}`,
        (error, token) => `throw keyLen=${token.length} error=${getErrorMessage(error)}`
    )
    private async commitSourceType(
        token: string,
        fetchSourceType: () => Promise<BankSyncResultInterface<BankTransactionInterface[]>>
    ): Promise<number> {
        const transactions = await this.resolveSourceTransactions(fetchSourceType);
        if (!isNotEmptyArray(transactions)) {
            return 0;
        }

        const existingIds = await transactionService.findByExternalSource(this.provider);
        const newTransactions = transactions.filter(bankTransaction => !existingIds.has(bankTransaction.id));
        if (!isNotEmptyArray(newTransactions)) {
            return 0;
        }

        return this.createSyncedSources(newTransactions, token);
    }

    @Log(
        transactions => `enter externalIds=${transactions.map(transaction => transaction.id).join(',')}`,
        (result, transactions) => `done count=${transactions.length} createdCount=${result}`,
        (error, transactions) =>
            `throw externalIds=${transactions.map(transaction => transaction.id).join(',')} error=${getErrorMessage(error)}`
    )
    private async createSyncedSources(transactions: BankTransactionInterface[], token: string): Promise<number> {
        const bankAccounts = await this.fetchBankAccounts(token);
        const resolveAccount = this.buildTransferAccountResolver(new Map(bankAccounts.map(bankAccount => [bankAccount.id, bankAccount])));
        const inputs = await this.collectSourceInputs(transactions, resolveAccount);
        if (!isNotEmptyArray(inputs)) {
            return 0;
        }

        const created = await transactionService.bulkCreate(inputs);
        if (isPositiveNumber(created.length)) {
            await transactionService.updateAllBalances();
        }

        return created.length;
    }

    @Log(
        (sync, externalAccountId) => `enter syncId=${sync.id} externalAccountId=${externalAccountId} mode=${sync.mode}`,
        (result, sync, externalAccountId) => `done syncId=${sync.id} externalAccountId=${externalAccountId} count=${result.length}`,
        (error, sync, externalAccountId) => `throw syncId=${sync.id} externalAccountId=${externalAccountId} error=${getErrorMessage(error)}`
    )
    private async fetchTransferBatch(sync: BankSyncEntityInterface, externalAccountId: string): Promise<BinanceTransferInterface[]> {
        const client = this.getRunSignedClient(sync.token);
        const from = await this.resolveTransferWindowStart(sync);
        const result = await client.getTransfers(externalAccountId, getUnixTime(from));

        if (result.success) {
            return result.data;
        }

        if (result.error.code === BankSyncErrorCodeEnum.INVALID_RESPONSE) {
            return [];
        }

        // eslint-disable-next-line lingui/no-unlocalized-strings
        throw new Error(`Failed to fetch transfers ${getErrorMessage(result.error)}`);
    }

    @Log(
        transfers => `enter externalIds=${transfers.map(transfer => transfer.externalId).join(',')}`,
        (result, transfers) => `done count=${transfers.length} createdCount=${result}`,
        (error, transfers) =>
            `throw externalIds=${transfers.map(transfer => transfer.externalId).join(',')} error=${getErrorMessage(error)}`
    )
    private async createSyncedTransfers(transfers: BinanceTransferInterface[], token: string): Promise<number> {
        const bankAccounts = await this.fetchBankAccounts(token);
        const resolveAccount = this.buildTransferAccountResolver(new Map(bankAccounts.map(bankAccount => [bankAccount.id, bankAccount])));

        let createdCount = 0;
        for (const transfer of transfers) {
            const isCreated = await this.createSyncedTransfer(transfer, resolveAccount);
            createdCount += isCreated ? 1 : 0;
        }

        if (isPositiveNumber(createdCount)) {
            await transactionService.updateAllBalances();
        }

        return createdCount;
    }

    @Log(
        (sync, result) =>
            `enter syncId=${sync.id} mode=${sync.mode} count=${result.transactions.length} completed=${String(result.completed)}`,
        'done',
        (error, sync) => `throw syncId=${sync.id} mode=${sync.mode} error=${getErrorMessage(error)}`
    )
    private async updateSyncProgress(sync: BankSyncEntityInterface, result: BankSyncBatchResultInterface): Promise<void> {
        await applyBankSyncProgressUpdate(sync, result);
    }

    @Log(
        token => `enter keyLen=${token.length}`,
        (result, token) => `done keyLen=${token.length} anchoredCount=${result}`,
        (error, token) => `throw keyLen=${token.length} error=${getErrorMessage(error)}`
    )
    private async anchorAllBalances(token: string): Promise<number> {
        const bankAccounts = await this.fetchBankAccounts(token);
        const balanceByExternalId = new Map(bankAccounts.map(bankAccount => [bankAccount.id, bankAccount.balance]));
        const accounts = await accountRepository.findByExternalSource(this.provider);

        let anchoredCount = 0;
        for (const account of accounts) {
            const balance = isNotEmptyString(account.externalId) ? (balanceByExternalId.get(account.externalId) ?? 0) : 0;
            await this.anchorAccountBalance(account.id, balance);
            anchoredCount += 1;
        }

        return anchoredCount;
    }

    private resetRunState(): void {
        this.transfersSyncedThisRun = false;
        this.sourcesSyncedThisRun = false;
        this.balancesAnchoredThisRun = false;
        this.runSyncService = null;
        this.runSignedClient = null;
        this.runClientToken = null;
    }

    private async resolveSourceWindowStart(): Promise<number> {
        const earliestTransactionTime = await transactionService.getEarliestTransactionTimeByExternalSource(this.provider);
        const from = subYears(new Date(), BINANCE_TRANSFER_LOOKBACK_YEARS);

        return getUnixTime(earliestTransactionTime ?? from);
    }

    private async resolveSourceTransactions(
        fetchSourceType: () => Promise<BankSyncResultInterface<BankTransactionInterface[]>>
    ): Promise<BankTransactionInterface[]> {
        const result = await fetchSourceType();
        if (result.success) {
            return result.data;
        }

        if (result.error.code === BankSyncErrorCodeEnum.INVALID_RESPONSE) {
            return [];
        }

        // eslint-disable-next-line lingui/no-unlocalized-strings
        throw new Error(`Failed to fetch sources ${getErrorMessage(result.error)}`);
    }

    private async buildSourceCreateInput(
        transaction: BankTransactionInterface,
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
        transactions: BankTransactionInterface[],
        resolveAccount: (codecAccountId: string) => Promise<AccountEntityInterface | null>
    ): Promise<TransactionCreateInputInterface[]> {
        const inputs: TransactionCreateInputInterface[] = [];
        for (const transaction of transactions) {
            const input = await this.buildSourceCreateInput(transaction, resolveAccount);
            if (isDefined(input)) {
                inputs.push(input);
            }
        }

        return inputs;
    }

    private getRunSyncService(token: string): BinanceSyncService {
        if (!isDefined(this.runSyncService) || this.runClientToken !== token) {
            this.runSyncService = new BinanceSyncService(token);
            this.runClientToken = token;
        }

        return this.runSyncService;
    }

    private getRunSignedClient(token: string): BinanceSignedClient {
        if (!isDefined(this.runSignedClient) || this.runClientToken !== token) {
            this.runSignedClient = new BinanceSignedClient(token);
            this.runClientToken = token;
        }

        return this.runSignedClient;
    }

    private async resolveTransferWindowStart(sync: BankSyncEntityInterface): Promise<Date> {
        const earliestTransactionTime = await transactionService.getEarliestTransactionTimeByAccountId(sync.accountId);

        return earliestTransactionTime ?? sync.backwardSyncedAt ?? subYears(new Date(), BINANCE_TRANSFER_LOOKBACK_YEARS);
    }

    private async createSyncedTransfer(
        transfer: BinanceTransferInterface,
        resolveAccount: (codecAccountId: string) => Promise<AccountEntityInterface | null>
    ): Promise<boolean> {
        const input = await mapBinanceTransferToCreateInput(transfer, resolveAccount);
        if (!isDefined(input)) {
            logger.log('createSyncedTransfers:skip-parked-leg', { externalId: transfer.externalId });

            return false;
        }

        await transactionService.createSyncedTransfer(input);

        return true;
    }

    private buildTransferAccountResolver(
        bankAccounts: Map<string, BankAccountInterface>
    ): (codecAccountId: string) => Promise<AccountEntityInterface | null> {
        const instrumentsPromise = instrumentRepository.getAll();

        return async (codecAccountId: string): Promise<AccountEntityInterface | null> => {
            const existingAccount = (await accountRepository.findByExternalIds([codecAccountId])).at(0);
            if (isDefined(existingAccount)) {
                return existingAccount;
            }

            const bankAccount = bankAccounts.get(codecAccountId) ?? this.buildBankAccountFromCodec(codecAccountId);
            if (!isDefined(bankAccount)) {
                return null;
            }

            const instrument = this.resolveInstrument(bankAccount, await instrumentsPromise);
            if (!isDefined(instrument)) {
                return null;
            }

            return this.getOrCreateAccount(bankAccount, instrument.id);
        };
    }

    private buildBankAccountFromCodec(codecAccountId: string): BankAccountInterface | null {
        const decoded = decodeBinanceAccountId(codecAccountId);
        if (!isDefined(decoded)) {
            return null;
        }

        return binanceMapper.mapBalanceToAccount(decoded.asset, decoded.wallet, 0);
    }

    private resolveInstrument(
        bankAccount: BankAccountInterface,
        instruments: InstrumentEntityInterface[]
    ): InstrumentEntityInterface | null {
        const instrumentCode = resolveBinanceInstrumentCode(bankAccount.currencyCode);
        if (!isNotEmptyString(instrumentCode)) {
            return null;
        }

        return instruments.find(instrument => instrument.code === instrumentCode) ?? null;
    }

    private resolveAccountInstrumentId(
        bankAccount: BankAccountInterface,
        instruments: InstrumentEntityInterface[]
    ): BinanceResolvableAccountInterface | null {
        const instrument = this.resolveInstrument(bankAccount, instruments);

        return isDefined(instrument) ? { bankAccount, instrumentId: instrument.id } : null;
    }

    private async anchorAccountBalance(accountId: number, balance: number): Promise<void> {
        await accountBalanceRepository.upsert({ accountId, amount: convertToMicroUnits(balance), updatedAt: new Date() });
    }

    private async getOrCreateAccount(bankAccount: BankAccountInterface, instrumentId: number): Promise<AccountEntityInterface> {
        const existingByExternalId = await accountRepository.findByExternalIds([bankAccount.id]);
        const existingAccount = existingByExternalId.at(0);
        if (isDefined(existingAccount)) {
            return existingAccount;
        }

        const input = mapBankAccountToCreateInput(bankAccount, instrumentId, this.provider);
        const createdAccount = Object.values(await accountService.bulkCreate([input])).at(0);
        if (!isDefined(createdAccount)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error('Failed to create Binance account');
        }

        return createdAccount;
    }
}

export const binanceSyncService = new AppBinanceSyncService();
