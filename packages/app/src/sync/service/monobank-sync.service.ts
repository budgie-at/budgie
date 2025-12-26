/* eslint-disable lingui/no-unlocalized-strings */
import {
    BankAccountInterface,
    BankProviderEnum,
    BankTransactionInterface,
    BankTransactionTypeEnum,
    MONOBANK_AUTH_URL,
    MonobankSyncService
} from '@budgie/bank-sync';
import {
    AccountCreateEntityInterface,
    AccountNatureEnum,
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionCreateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as Linking from 'expo-linking';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { FIFTEEN_MINUTES_IN_SECONDS } from '../../account/constant/fifteen-minutes-in-seconds.constant';
import { MonobankSyncResultInterface } from '../../account/interface/monobank-sync-result.interface';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { accountService } from '../../account/service/account.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { SyncStepEnum } from '../enum/sync-step.enum';

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
    async sync(): Promise<MonobankSyncResultInterface> {
        const syncService = new MonobankSyncService(this.getToken());

        try {
            const bankAccounts = await syncService.syncAccounts();
            bankSyncStorageService.startSync(this.provider, bankAccounts.length);

            const accounts = await this.createAccounts(bankAccounts);
            const externalIdAccountMap = new Map<string, AccountEntityInterface>();
            const ibanToAccountMap = new Map<string, AccountEntityInterface>();

            for (const account of accounts) {
                if (isNotEmptyString(account.iban)) {
                    ibanToAccountMap.set(account.iban, account);
                }
                if (isNotEmptyString(account.externalId)) {
                    externalIdAccountMap.set(account.externalId, account);
                }
            }

            await microPause();

            const transactions: TransactionEntityInterface[] = await transactionService.findByExternalSource(ExternalSourceEnum.MONOBANK);
            const importedTransactions: BankTransactionInterface[] = [];
            const existingTransactionIds = new Set(transactions.map(tx => tx.externalId));

            for (let i = 0; i < bankAccounts.length; i += 1) {
                const account = bankAccounts[i];
                // eslint-disable-next-line no-await-in-loop
                const latestTxTime = await transactionService.getLatestTransactionTimeByAccountExternalId(account.id);
                let batchCount = 0;

                // eslint-disable-next-line no-await-in-loop
                for await (const bankTransactions of syncService.syncTransactions(account.id, latestTxTime)) {
                    const newBankTransactions = bankTransactions.filter(tx => !existingTransactionIds.has(tx.id));
                    transactions.push(...(await this.createTransactions(newBankTransactions, externalIdAccountMap)));
                    importedTransactions.push(...newBankTransactions);

                    batchCount += 1;

                    bankSyncStorageService.updateProgress(this.provider, {
                        step: SyncStepEnum.SYNCING_TRANSACTIONS,
                        currentAccount: i + 1,
                        totalAccounts: bankAccounts.length,
                        totalTransactions: importedTransactions.length,
                        currentBatch: batchCount
                    });

                    await microPause();
                }
            }

            await accountBalanceIncrementalService.updateAllBalances(new Date(0));
            bankSyncStorageService.completeSync(this.provider, importedTransactions.length);

            return { success: true, accounts, transactions };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            bankSyncStorageService.failSync(this.provider, errorMessage);

            return { success: false, accounts: [], transactions: [], error: errorMessage };
        }
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

    // TODO: Will be used for automatic transfer detection
    // @ts-expect-error - Will be used for automatic transfer detection
    private createTransferTransaction(
        bankTx: BankTransactionInterface,
        account: AccountEntityInterface,
        counterAccount: AccountEntityInterface
    ): TransactionCreateEntityInterface {
        const isIncome = bankTx.type === BankTransactionTypeEnum.INCOME;
        const amount = Math.abs(bankTx.amount);
        const operationAmount = Math.abs(bankTx.operationAmount);

        const sourceAccount = isIncome ? counterAccount : account;
        const destAccount = isIncome ? account : counterAccount;

        const sourceAmount = isIncome ? operationAmount : amount;
        const destAmount = isIncome ? amount : operationAmount;

        const hasCurrencyExchange = sourceAccount.instrumentId !== destAccount.instrumentId;
        const exchangeRate = hasCurrencyExchange && sourceAmount > 0 ? destAmount / sourceAmount : 1;

        return {
            amount: destAmount,
            title: bankTx.description,
            comment: bankTx.comment ?? '',
            type: TransactionTypeEnum.TRANSFER,
            exchangeRate,
            operatedAt: new Date(bankTx.time * 1000),
            externalId: bankTx.id,
            externalSource: ExternalSourceEnum.MONOBANK,
            fromAccountId: sourceAccount.id,
            toAccountId: destAccount.id,
            tagIds: [],
            entries: [
                {
                    accountId: sourceAccount.id,
                    type: TransactionEntryTypeEnum.DEBIT,
                    amount: sourceAmount,
                    categoryId: null,
                    externalId: bankTx.id
                },
                {
                    accountId: destAccount.id,
                    type: TransactionEntryTypeEnum.CREDIT,
                    amount: destAmount,
                    categoryId: null,
                    externalId: bankTx.id
                }
            ]
        };
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
