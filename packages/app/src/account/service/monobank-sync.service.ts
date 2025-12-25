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
import { MONOBANK_TOKEN_KEY } from '../constant/monobank-token-key.constant';

import { accountService } from './account.service';

import type { AccountEntityInterface, InstrumentEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

interface MonobankSyncResultInterface {
    readonly success: boolean;
    readonly accounts: AccountEntityInterface[];
    readonly transactions: TransactionEntityInterface[];
    readonly error?: string;
}

interface TransactionInputParamsInterface {
    readonly bankTx: BankTransactionInterface;
    readonly isExpense: boolean;
    readonly amount: number;
    readonly accountId: number;
    readonly instrumentId: number;
}

const MONOBANK_BALANCE_DIVISOR = 100;
const THIRTY_DAYS_IN_SECONDS = 2592000;

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
        const token = await this.getToken();

        return isDefined(token);
    }

    async getClientInfo(): Promise<BankSyncResultInterface<BankClientInfoInterface>> {
        const client = await this.getClient();

        return client.getClientInfo();
    }

    async syncAccounts(): Promise<MonobankSyncResultInterface> {
        const client = await this.getClient();

        const accountsResult = await client.getAccounts();

        if (!accountsResult.success) {
            return { success: false, accounts: [], transactions: [], error: accountsResult.error.message };
        }

        const accounts = await this.createAccountsFromBankAccounts(accountsResult.data);

        return { success: true, accounts, transactions: [] };
    }

    // eslint-disable-next-line max-statements
    async syncTransactions(accountId: number, externalAccountId: string, instrumentId: number): Promise<MonobankSyncResultInterface> {
        const client = await this.getClient();

        const now = Math.floor(Date.now() / 1000);
        const from = now - THIRTY_DAYS_IN_SECONDS;

        const transactionsResult = await client.getTransactions(externalAccountId, from, now);
        if (!transactionsResult.success) {
            return { success: false, accounts: [], transactions: [], error: transactionsResult.error.message };
        }

        const existingTransactions = await transactionService.findByExternalSource(ExternalSourceEnum.MONOBANK);
        const existingExternalIds = new Set(existingTransactions.map(tx => tx.externalId));

        const transactionsToCreate: TransactionCreateEntityInterface[] = [];
        for (const bankTx of transactionsResult.data) {
            if (!existingExternalIds.has(bankTx.id)) {
                const isExpense = bankTx.amount < 0;
                const amount = Math.abs(bankTx.amount) / MONOBANK_BALANCE_DIVISOR;

                transactionsToCreate.push(this.createTransactionInput({ bankTx, isExpense, amount, accountId, instrumentId }));
            }
        }

        return {
            success: true,
            accounts: [],
            transactions: [...existingTransactions, ...(await transactionService.bulkCreate(transactionsToCreate))]
        };
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
        const existingExternalIds = new Set(existingAccounts.map((acc: AccountEntityInterface) => acc.externalId));

        const accountsToCreate: AccountCreateEntityInterface[] = [];

        for (const bankAccount of bankAccounts) {
            const instrument = this.findInstrumentByCode(instruments, bankAccount.currencyCode);

            if (isDefined(instrument) && !existingExternalIds.has(bankAccount.id)) {
                accountsToCreate.push({
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

        if (!isNotEmptyArray(accountsToCreate)) {
            return existingAccounts;
        }

        const createdAccounts = await accountService.bulkCreate(accountsToCreate);

        return [...existingAccounts, ...Object.values(createdAccounts)];
    }

    private createTransactionInput(params: TransactionInputParamsInterface): TransactionCreateEntityInterface {
        const { bankTx, isExpense, amount, accountId, instrumentId } = params;
        const entryType = isExpense ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;

        return {
            title: bankTx.description,
            comment: bankTx.comment ?? '',
            type: isExpense ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME,
            amount,
            exchangeRate: 1,
            operatedAt: new Date(bankTx.time * 1000),
            externalId: bankTx.id,
            externalSource: ExternalSourceEnum.MONOBANK,
            fromAccountId: isExpense ? accountId : null,
            toAccountId: isExpense ? null : accountId,
            tagIds: [],
            entries: [
                {
                    accountId,
                    instrumentId,
                    type: entryType,
                    amount,
                    categoryId: null
                }
            ]
        };
    }

    private findInstrumentByCode(instruments: InstrumentEntityInterface[], currencyCode: string): InstrumentEntityInterface | undefined {
        return instruments.find(inst => inst.code === currencyCode);
    }

    private generateAccountTitle(bankAccount: BankAccountInterface): string {
        const cardType = bankAccount.type.charAt(0).toUpperCase() + bankAccount.type.slice(1).toLowerCase();

        if (isNotEmptyArray(bankAccount.maskedPan)) {
            const lastFour = bankAccount.maskedPan[0].slice(-4);

            return `Monobank ${cardType} •${lastFour}`;
        }

        return `Monobank ${cardType} ${bankAccount.currencyCode}`;
    }
}

export const monobankSyncService = new MonobankSyncService();
