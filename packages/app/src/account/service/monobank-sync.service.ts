/* eslint-disable lingui/no-unlocalized-strings,no-await-in-loop */
import {
    BankAccountInterface,
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
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { SyncStepEnum } from '../../sync/enum/sync-step.enum';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { MONOBANK_TOKEN_KEY } from '../constant/monobank-token-key.constant';
import { ONE_HOUR_IN_SECONDS } from '../constant/one-hour-in-seconds.constant';
import { MonobankSyncResultInterface } from '../interface/monobank-sync-result.interface';
import { SyncProgressCallbackType } from '../type/sync-progress-callback.type';

import { accountBalanceIncrementalService } from './account-balance-incremental.service';
import { accountService } from './account.service';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

const MONOBANK_BALANCE_DIVISOR = 100;

class AppMonobankSyncService {
    async openAuthPage(): Promise<void> {
        await Linking.openURL(MONOBANK_AUTH_URL);
    }

    saveToken(token: string): void {
        SecureStore.setItem(MONOBANK_TOKEN_KEY, token);
    }

    getToken(): string {
        return SecureStore.getItem(MONOBANK_TOKEN_KEY) ?? '';
    }

    async deleteToken(): Promise<void> {
        await SecureStore.deleteItemAsync(MONOBANK_TOKEN_KEY);
    }

    async hasToken(): Promise<boolean> {
        return isDefined(this.getToken());
    }

    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(MONOBANK_SYNC_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(MONOBANK_SYNC_TASK, {
            minimumInterval: ONE_HOUR_IN_SECONDS
        });
    }

    // eslint-disable-next-line max-statements
    async sync(onProgress?: SyncProgressCallbackType): Promise<MonobankSyncResultInterface> {
        const syncService = new MonobankSyncService(this.getToken());

        onProgress?.({ step: SyncStepEnum.SYNCING_ACCOUNTS });
        const bankAccounts = await syncService.syncAccounts();
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

        const transactions: TransactionEntityInterface[] = [];
        const importedTransactions: BankTransactionInterface[] = [];
        const existingTransactions = await transactionService.findByExternalSource(ExternalSourceEnum.MONOBANK);
        const existingTransactionIds = new Set(existingTransactions.map(tx => tx.externalId));

        for (let i = 0; i < bankAccounts.length; i += 1) {
            const account = bankAccounts[i];
            const latestTxTime = await this.getLatestTransactionTime(account.id);

            let batchCount = 0;

            for await (const bankTransactions of syncService.syncTransactions(account.id, latestTxTime ?? 0)) {
                importedTransactions.push(...bankTransactions);
                transactions.push(...(await this.createTransactions(bankTransactions, externalIdAccountMap, existingTransactionIds)));

                await microPause();

                onProgress?.({
                    step: SyncStepEnum.SYNCING_TRANSACTIONS,
                    currentAccount: i + 1,
                    totalAccounts: bankAccounts.length,
                    currentBatch: (batchCount += 1)
                });
            }

            await accountBalanceIncrementalService.updateAllBalances(new Date(0));
            await microPause();
        }

        for (const bankTx of importedTransactions) {
            const fromAccount = externalIdAccountMap.get(bankTx.accountId);
            const toAccount = ibanToAccountMap.get(bankTx.counterIban ?? '');

            if (isDefined(fromAccount) && isDefined(toAccount)) {
                const counterBankTx = importedTransactions.find(tx => {
                    const counterFromAccount = externalIdAccountMap.get(tx.accountId);
                    const counterToAccount = ibanToAccountMap.get(tx.counterIban ?? '');

                    if (isDefined(counterFromAccount) && isDefined(counterToAccount)) {
                        return tx.id !== bankTx.id && counterFromAccount.id === toAccount.id && counterToAccount.id === fromAccount.id;
                    }

                    return false;
                });

                console.log('Found transfer', { bankTx, counterBankTx });
            }
        }

        return { success: true, accounts, transactions };
    }

    private async getLatestTransactionTime(externalId: string): Promise<number | null> {
        const account = await accountRepository.findByExternalId(externalId);
        if (!isDefined(account)) {
            return null;
        }

        const transactions = await transactionService.findByAccountId(account.id);
        const nonAdjustmentTx = transactions.filter(tx => tx.type !== TransactionTypeEnum.ADJUSTMENT);

        if (!isNotEmptyArray(nonAdjustmentTx)) {
            return null;
        }

        const latestTx = nonAdjustmentTx.reduce((latest, tx) =>
            new Date(tx.operatedAt).getTime() > new Date(latest.operatedAt).getTime() ? tx : latest
        );

        return Math.floor(new Date(latestTx.operatedAt).getTime() / 1000);
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
        accountsMap: Map<string | null, AccountEntityInterface>,
        existingTransactionIds: Set<string | null>
    ): Promise<TransactionEntityInterface[]> {
        const transactionsToCreate = [];
        for (const bankTx of bankTransactions) {
            const account = accountsMap.get(bankTx.accountId);

            if (isDefined(account) && !existingTransactionIds.has(bankTx.id)) {
                const isIncome = bankTx.type === BankTransactionTypeEnum.INCOME;
                const amount = Math.abs(bankTx.amount) / MONOBANK_BALANCE_DIVISOR;
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

    private createTransferTransaction(
        bankTx: BankTransactionInterface,
        account: AccountEntityInterface,
        counterAccount: AccountEntityInterface
    ): TransactionCreateEntityInterface {
        const isIncome = bankTx.type === BankTransactionTypeEnum.INCOME;
        const amount = Math.abs(bankTx.amount) / MONOBANK_BALANCE_DIVISOR;
        const operationAmount = Math.abs(bankTx.operationAmount) / MONOBANK_BALANCE_DIVISOR;

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
