/* eslint-disable lingui/no-unlocalized-strings,no-await-in-loop */
import { BankAccountInterface, BankTransactionInterface, MONOBANK_AUTH_URL, MonobankSyncService } from '@budgie/bank-sync';
import {
    AccountCreateEntityInterface,
    AccountNatureEnum,
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { SyncStepEnum } from '../../@generic/sync/enum/sync-step.enum';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_TOKEN_KEY } from '../constant/monobank-token-key.constant';
import { MonobankSyncResultInterface } from '../interface/monobank-sync-result.interface';

import { accountService } from './account.service';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

const MONOBANK_BALANCE_DIVISOR = 100;

interface SyncProgressDataInterface {
    readonly step: SyncStepEnum;
    readonly currentAccount?: number;
    readonly totalAccounts?: number;
    readonly currentBatch?: number;
}

type SyncProgressCallbackType = (data: SyncProgressDataInterface) => void;

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

    // eslint-disable-next-line max-statements
    async sync(onProgress?: SyncProgressCallbackType): Promise<MonobankSyncResultInterface> {
        const syncService = new MonobankSyncService(this.getToken());

        onProgress?.({ step: SyncStepEnum.SYNCING_ACCOUNTS });
        const bankAccounts = await syncService.syncAccounts();
        const accounts = await this.createAccounts(bankAccounts);

        const transactions: TransactionEntityInterface[] = [];

        for (let i = 0; i < bankAccounts.length; i += 1) {
            const account = bankAccounts[i];
            const latestTxTime = await this.getLatestTransactionTime(account.id);
            let batchCount = 0;

            for await (const bankTransactions of syncService.syncTransactions(account.id, latestTxTime ?? 0)) {
                batchCount += 1;
                onProgress?.({
                    step: SyncStepEnum.SYNCING_TRANSACTIONS,
                    currentAccount: i + 1,
                    totalAccounts: bankAccounts.length,
                    currentBatch: batchCount
                });
                await microPause();
                transactions.push(...(await this.createTransactions(bankTransactions, accounts)));
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
        const instruments = await instrumentRepository.getAll();
        const existingAccounts = await accountRepository.findByExternalIds(bankAccounts.map(account => account.id));
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
                    externalSource: ExternalSourceEnum.MONOBANK
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
        accounts: AccountEntityInterface[]
    ): Promise<TransactionEntityInterface[]> {
        const existingTransactions = await transactionService.findByExternalSource(ExternalSourceEnum.MONOBANK);
        const existingIds = new Set(existingTransactions.map(tx => tx.externalId));
        const accountsMap = new Map(accounts.map(acc => [acc.externalId, acc]));

        const transactionsToCreate = [];
        for (const bankTx of bankTransactions) {
            const account = accountsMap.get(bankTx.accountId);

            if (isDefined(account) && !existingIds.has(bankTx.id)) {
                const isExpense = bankTx.amount < 0;
                const amount = Math.abs(bankTx.amount) / MONOBANK_BALANCE_DIVISOR;
                const entryType = isExpense ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;

                transactionsToCreate.push({
                    title: bankTx.description,
                    comment: bankTx.comment ?? '',
                    type: isExpense ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME,
                    amount,
                    exchangeRate: 1,
                    operatedAt: new Date(bankTx.time * 1000),
                    externalId: bankTx.id,
                    externalSource: ExternalSourceEnum.MONOBANK,
                    fromAccountId: isExpense ? account.id : null,
                    toAccountId: isExpense ? null : account.id,
                    tagIds: [],
                    entries: [{ accountId: account.id, instrumentId: account.instrumentId, type: entryType, amount, categoryId: null }]
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
