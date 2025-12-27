/* eslint-disable lingui/no-unlocalized-strings */
import {
    BankAccountInterface,
    BankProviderEnum,
    BankSyncBatchResultInterface,
    BankTransactionInterface,
    BankTransactionTypeEnum,
    MONOBANK_AUTH_URL,
    MONOBANK_RATE_LIMIT_MS,
    MonobankSyncService
} from '@budgie/bank-sync';
import {
    AccountCreateEntityInterface,
    AccountNatureEnum,
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as Linking from 'expo-linking';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { FIFTEEN_MINUTES_IN_SECONDS } from '../../account/constant/fifteen-minutes-in-seconds.constant';
import { accountService } from '../../account/service/account.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { SyncStatusEnum } from '../enum/sync-status.enum';
import { AccountSyncCursorInterface } from '../interface/bank-sync-state.interface';

import { bankSyncStorageService } from './bank-sync-storage.service';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

class AppMonobankSyncService {
    private readonly provider = BankProviderEnum.MONOBANK;

    async openAuthPage(): Promise<void> {
        await Linking.openURL(MONOBANK_AUTH_URL);
    }

    saveToken(token: string): void {
        bankSyncStorageService.setToken(this.provider, token);
    }

    getToken(): string {
        return bankSyncStorageService.getToken(this.provider) ?? '';
    }

    deleteToken(): void {
        bankSyncStorageService.setToken(this.provider, null);
    }

    hasToken(): boolean {
        return bankSyncStorageService.hasToken(this.provider);
    }

    isEnabled(): boolean {
        return bankSyncStorageService.isEnabled(this.provider);
    }

    setEnabled(enabled: boolean): void {
        bankSyncStorageService.setEnabled(this.provider, enabled);

        if (enabled) {
            void this.registerBackgroundTask();
        } else {
            void this.unregisterBackgroundTask();
        }
    }

    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(MONOBANK_SYNC_TASK)) {
            return;
        }

        TaskManager.defineTask(MONOBANK_SYNC_TASK, () => this.sync());

        await BackgroundTask.registerTaskAsync(MONOBANK_SYNC_TASK, {
            minimumInterval: FIFTEEN_MINUTES_IN_SECONDS
        });
    }

    async unregisterBackgroundTask(): Promise<void> {
        if (!(await TaskManager.isTaskRegisteredAsync(MONOBANK_SYNC_TASK))) {
            return;
        }

        await BackgroundTask.unregisterTaskAsync(MONOBANK_SYNC_TASK);
    }

    // eslint-disable-next-line max-statements
    async sync(): Promise<BackgroundTask.BackgroundTaskResult> {
        try {
            const state = bankSyncStorageService.getState(BankProviderEnum.MONOBANK);

            if (!state.enabled || !bankSyncStorageService.hasToken(BankProviderEnum.MONOBANK)) {
                return BackgroundTask.BackgroundTaskResult.Success;
            }

            if (state.status === SyncStatusEnum.SYNCING) {
                const cursor = bankSyncStorageService.getNextPendingAccountId(BankProviderEnum.MONOBANK);
                if (isDefined(cursor)) {
                    const result = await this.syncBatch(cursor);

                    bankSyncStorageService.updateAccountCursor(BankProviderEnum.MONOBANK, cursor.accountId, result);

                    await microPause(MONOBANK_RATE_LIMIT_MS);

                    return await this.sync();
                }

                bankSyncStorageService.completeSync(this.provider);

                return BackgroundTask.BackgroundTaskResult.Success;
            }

            try {
                const syncedAccounts = await this.syncAccounts();

                await bankSyncStorageService.startSync(BankProviderEnum.MONOBANK, syncedAccounts);

                return BackgroundTask.BackgroundTaskResult.Success;
            } catch (error: unknown) {
                bankSyncStorageService.failSync(BankProviderEnum.MONOBANK, getErrorMessage(error, 'Unknown error'));

                return BackgroundTask.BackgroundTaskResult.Failed;
            }
        } catch (error: unknown) {
            bankSyncStorageService.failSync(BankProviderEnum.MONOBANK, getErrorMessage(error, 'Unknown error'));

            return BackgroundTask.BackgroundTaskResult.Failed;
        }
    }

    private async syncAccounts(): Promise<AccountEntityInterface[]> {
        const syncService = new MonobankSyncService(this.getToken());

        const bankAccounts = await syncService.syncAccounts();
        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        return await this.createAccounts(bankAccounts);
    }

    // eslint-disable-next-line max-statements
    private async syncBatch(cursor: AccountSyncCursorInterface): Promise<BankSyncBatchResultInterface> {
        const syncService = new MonobankSyncService(this.getToken());
        const result = await syncService.syncTransactionsBatch(cursor.externalAccountId, cursor.fromTime, cursor.toTime);

        const accounts = await accountRepository.findByExternalIds(result.transactions.map(tx => tx.accountId));
        const externalIdAccountMap = new Map<string, AccountEntityInterface>();

        for (const account of accounts) {
            if (isNotEmptyString(account.externalId)) {
                externalIdAccountMap.set(account.externalId, account);
            }
        }

        const existingTransactions = await transactionService.findByExternalSource(ExternalSourceEnum.MONOBANK);
        const existingTxIds = new Set(existingTransactions.map(tx => tx.externalId));
        const newTransactions = result.transactions.filter(tx => !existingTxIds.has(tx.id));

        if (isNotEmptyArray(newTransactions)) {
            await this.createTransactions(newTransactions, externalIdAccountMap);
        }

        await microPause();

        return result;
    }

    private async createAccounts(bankAccounts: BankAccountInterface[]): Promise<AccountEntityInterface[]> {
        const [instruments, existingAccounts] = await Promise.all([
            instrumentRepository.getAll(),
            accountRepository.findByExternalIds(bankAccounts.map(account => account.id))
        ]);

        const existingIds = new Set(existingAccounts.map(acc => acc.externalId));

        const toCreate: AccountCreateEntityInterface[] = [];
        for (const bankAccount of bankAccounts) {
            const instrument = instruments.find(i => i.code === bankAccount.currencyCode);

            if (isDefined(instrument) && !existingIds.has(bankAccount.id)) {
                toCreate.push({
                    title: this.generateAccountTitle(bankAccount),
                    type: AccountTypeEnum.BANK,
                    nature: AccountNatureEnum.ASSET,
                    icon: UserIconNameEnum.Landmark,
                    instrumentId: instrument.id,
                    currentBalance: 0,
                    externalId: bankAccount.id,
                    externalSource: ExternalSourceEnum.MONOBANK,
                    iban: bankAccount.iban
                });
            }
        }

        if (!isNotEmptyArray(toCreate)) {
            return existingAccounts;
        }

        return [...existingAccounts, ...Object.values(await accountService.bulkCreate(toCreate))];
    }

    private async createTransactions(
        bankTransactions: BankTransactionInterface[],
        accountsMap: Map<string | null, AccountEntityInterface>
    ): Promise<TransactionEntityInterface[]> {
        const transactionsToCreate = [];
        for (const bankTx of bankTransactions) {
            const account = accountsMap.get(bankTx.accountId);

            if (isDefined(account)) {
                const isIncome = bankTx.type === BankTransactionTypeEnum.INCOME;
                const amount = Math.abs(bankTx.amount);
                const entryType = isIncome ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;

                transactionsToCreate.push({
                    amount,
                    title: bankTx.description,
                    comment: bankTx.comment ?? '',
                    type: isIncome ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
                    exchangeRate: 1,
                    operatedAt: new Date(bankTx.time * 1000),
                    externalId: bankTx.id,
                    externalSource: ExternalSourceEnum.MONOBANK,
                    fromAccountId: isIncome ? null : account.id,
                    toAccountId: isIncome ? account.id : null,
                    tagIds: [],
                    entries: [{ accountId: account.id, type: entryType, amount, categoryId: null, externalId: bankTx.id }]
                });
            }
        }

        return await transactionService.bulkCreate(transactionsToCreate);
    }

    private generateAccountTitle(bankAccount: BankAccountInterface): string {
        const cardType = bankAccount.type.charAt(0).toUpperCase() + bankAccount.type.slice(1).toLowerCase();
        if (isNotEmptyArray(bankAccount.maskedPan)) {
            return `Monobank ${cardType} •${bankAccount.maskedPan[0].slice(-4)}`;
        }

        return `Monobank ${cardType} ${bankAccount.currencyCode}`;
    }
}

export const monobankSyncService = new AppMonobankSyncService();
