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
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, instrumentRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
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

    async syncTransactions(accountId: number, externalAccountId: string): Promise<MonobankSyncResultInterface> {
        const client = await this.getClient();

        const now = Math.floor(Date.now() / 1000);
        const from = now - THIRTY_DAYS_IN_SECONDS;

        const transactionsResult = await client.getTransactions(externalAccountId, from, now);

        if (!transactionsResult.success) {
            return { success: false, accounts: [], transactions: [], error: transactionsResult.error.message };
        }

        const transactions = await this.createTransactionsFromBankTransactions(transactionsResult.data, accountId);

        return { success: true, accounts: [], transactions };
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
                const txResult = await this.syncTransactions(account.id, account.externalId);

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
            if (existingExternalIds.has(bankAccount.id)) {
                continue;
            }

            const instrument = this.findInstrumentByCode(instruments, bankAccount.currencyCode);

            if (!isDefined(instrument)) {
                continue;
            }

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

        if (!isNotEmptyArray(accountsToCreate)) {
            return existingAccounts;
        }

        const createdAccounts = await accountService.bulkCreate(accountsToCreate);

        return [...existingAccounts, ...Object.values(createdAccounts)];
    }

    private async createTransactionsFromBankTransactions(
        bankTransactions: BankTransactionInterface[],
        accountId: number
    ): Promise<TransactionEntityInterface[]> {
        const existingTransactions = await transactionRepository.findByExternalSource(ExternalSourceEnum.MONOBANK);
        const existingExternalIds = new Set(existingTransactions.map((tx: TransactionEntityInterface) => tx.externalId));

        const transactionsToCreate: TransactionCreateEntityInterface[] = [];

        for (const bankTx of bankTransactions) {
            if (existingExternalIds.has(bankTx.id)) {
                continue;
            }

            const isExpense = bankTx.amount < 0;
            const amount = convertToMicroUnits(Math.abs(bankTx.amount) / MONOBANK_BALANCE_DIVISOR);

            transactionsToCreate.push({
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
                entries: []
            });
        }

        if (!isNotEmptyArray(transactionsToCreate)) {
            return existingTransactions;
        }

        const createdTransactions = await transactionRepository.bulkCreate(transactionsToCreate);

        return [...existingTransactions, ...createdTransactions];
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
