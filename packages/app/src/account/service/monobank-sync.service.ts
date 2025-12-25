/* eslint-disable lingui/no-unlocalized-strings */
import {
    BankAccountInterface,
    BankClientInfoInterface,
    BankSyncResultInterface,
    BankTransactionInterface,
    MonobankClient
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
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { transactionService } from '../../transaction/service/transaction.service';
import { MONOBANK_AUTH_URL } from '../constant/monobank-auth-url.constant';
import { MAX_SYNC_PERIOD_SECONDS, MONOBANK_BALANCE_DIVISOR, SYNC_RATE_LIMIT_MS } from '../constant/monobank-sync.constant';
import { MONOBANK_TOKEN_KEY } from '../constant/monobank-token-key.constant';
import { MonobankSyncResultInterface } from '../interface/monobank-sync-result.interface';

import { accountService } from './account.service';

import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

class MonobankSyncService {
    private client: MonobankClient | undefined;

    async openAuthPage(): Promise<void> {
        await Linking.openURL(MONOBANK_AUTH_URL);
    }

    async saveToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(MONOBANK_TOKEN_KEY, token);
        this.client = new MonobankClient(token);
    }

    async getToken(): Promise<string | null> {
        return SecureStore.getItemAsync(MONOBANK_TOKEN_KEY);
    }

    async deleteToken(): Promise<void> {
        await SecureStore.deleteItemAsync(MONOBANK_TOKEN_KEY);
        this.client = void 0;
    }

    async hasToken(): Promise<boolean> {
        return isDefined(await this.getToken());
    }

    async getClientInfo(): Promise<BankSyncResultInterface<BankClientInfoInterface>> {
        return (await this.getClient()).getClientInfo();
    }

    async syncAccounts(): Promise<MonobankSyncResultInterface> {
        const accountsResult = await (await this.getClient()).getAccounts();
        if (!accountsResult.success) {
            return { success: false, accounts: [], transactions: [], error: accountsResult.error.message };
        }

        return { success: true, accounts: await this.createAccountsFromBankAccounts(accountsResult.data), transactions: [] };
    }

    async syncTransactions(accountId: number, externalAccountId: string, instrumentId: number): Promise<MonobankSyncResultInterface> {
        const existingTransactions = await transactionService.findByAccountId(accountId);

        return isNotEmptyArray(existingTransactions)
            ? this.performIncrementalSync(accountId, externalAccountId, instrumentId, existingTransactions)
            : this.performInitialSync(accountId, externalAccountId, instrumentId);
    }

    async fullSync(): Promise<MonobankSyncResultInterface> {
        const accountsResult = await this.syncAccounts();
        if (!accountsResult.success) {
            return accountsResult;
        }

        const allTransactions: TransactionEntityInterface[] = [];
        for (const account of accountsResult.accounts) {
            if (isDefined(account.externalId)) {
                // eslint-disable-next-line no-await-in-loop
                const txResult = await this.syncTransactions(account.id, account.externalId, account.instrumentId);
                if (txResult.success) {
                    allTransactions.push(...txResult.transactions);
                }
            }
        }

        return { success: true, accounts: accountsResult.accounts, transactions: allTransactions };
    }

    private async performIncrementalSync(
        accountId: number,
        externalAccountId: string,
        instrumentId: number,
        existingTransactions: TransactionEntityInterface[]
    ): Promise<MonobankSyncResultInterface> {
        const { fromTime, toTime } = this.calculateSyncPeriod(existingTransactions);
        const result = await (await this.getClient()).getTransactions(externalAccountId, fromTime, toTime);
        if (!result.success) {
            return { success: false, accounts: [], transactions: [], error: result.error.message };
        }

        const existingIds = new Set(existingTransactions.map(tx => tx.externalId));
        const newTx = await transactionService.bulkCreate(this.filterAndMapTransactions(result.data, existingIds, accountId, instrumentId));

        return { success: true, accounts: [], transactions: [...existingTransactions, ...newTx] };
    }

    // eslint-disable-next-line max-statements
    private async performInitialSync(
        accountId: number,
        externalAccountId: string,
        instrumentId: number
    ): Promise<MonobankSyncResultInterface> {
        const client = await this.getClient();
        const allTx: TransactionCreateEntityInterface[] = [];
        const existingIds = new Set<string | null>();
        let toTime = Math.floor(Date.now() / 1000);
        let hasMore = true;

        while (hasMore) {
            const fromTime = toTime - MAX_SYNC_PERIOD_SECONDS;
            // eslint-disable-next-line no-await-in-loop
            const result = await client.getTransactions(externalAccountId, fromTime, toTime);

            if (!result.success) {
                if (isNotEmptyArray(allTx)) {
                    break;
                }

                return { success: false, accounts: [], transactions: [], error: result.error.message };
            }

            if (isNotEmptyArray(result.data)) {
                allTx.push(...this.filterAndMapTransactions(result.data, existingIds, accountId, instrumentId));
                result.data.forEach(tx => existingIds.add(tx.id));
                toTime = fromTime;
                // eslint-disable-next-line no-await-in-loop
                await this.delay(SYNC_RATE_LIMIT_MS);
            } else {
                hasMore = false;
            }
        }

        return { success: true, accounts: [], transactions: await transactionService.bulkCreate(allTx) };
    }

    private filterAndMapTransactions(
        bankTx: BankTransactionInterface[],
        existingIds: Set<string | null>,
        accountId: number,
        instrumentId: number
    ): TransactionCreateEntityInterface[] {
        return bankTx
            .filter(tx => !existingIds.has(tx.id))
            .map(tx => {
                const isExpense = tx.amount < 0;
                const amount = Math.abs(tx.amount) / MONOBANK_BALANCE_DIVISOR;
                const entryType = isExpense ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;

                return {
                    title: tx.description,
                    comment: tx.comment ?? '',
                    type: isExpense ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME,
                    amount,
                    exchangeRate: 1,
                    operatedAt: new Date(tx.time * 1000),
                    externalId: tx.id,
                    externalSource: ExternalSourceEnum.MONOBANK,
                    fromAccountId: isExpense ? accountId : null,
                    toAccountId: isExpense ? null : accountId,
                    tagIds: [],
                    entries: [{ accountId, instrumentId, type: entryType, amount, categoryId: null }]
                };
            });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    private async getClient(): Promise<MonobankClient> {
        if (isDefined(this.client)) {
            return this.client;
        }
        const token = await this.getToken();
        if (!isDefined(token)) {
            throw new Error('Monobank token not found');
        }
        this.client = new MonobankClient(token);

        return this.client;
    }

    private async createAccountsFromBankAccounts(bankAccounts: BankAccountInterface[]): Promise<AccountEntityInterface[]> {
        const instruments = await instrumentRepository.getAll();
        const existingAccounts = await accountRepository.findByExternalSource(ExternalSourceEnum.MONOBANK);
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
                    currentBalance: bankAccount.balance / MONOBANK_BALANCE_DIVISOR,
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

    private calculateSyncPeriod(existingTransactions: TransactionEntityInterface[]): { fromTime: number; toTime: number } {
        const now = Math.floor(Date.now() / 1000);
        if (!isNotEmptyArray(existingTransactions)) {
            return { fromTime: now - MAX_SYNC_PERIOD_SECONDS, toTime: now };
        }

        const latestTx = existingTransactions.reduce((latest, tx) =>
            new Date(tx.operatedAt).getTime() > new Date(latest.operatedAt).getTime() ? tx : latest
        );

        return { fromTime: Math.floor(new Date(latestTx.operatedAt).getTime() / 1000), toTime: now };
    }

    private generateAccountTitle(bankAccount: BankAccountInterface): string {
        const cardType = bankAccount.type.charAt(0).toUpperCase() + bankAccount.type.slice(1).toLowerCase();
        if (isNotEmptyArray(bankAccount.maskedPan)) {
            return `Monobank ${cardType} •${bankAccount.maskedPan[0].slice(-4)}`;
        }

        return `Monobank ${cardType} ${bankAccount.currencyCode}`;
    }
}

export const monobankSyncService = new MonobankSyncService();
