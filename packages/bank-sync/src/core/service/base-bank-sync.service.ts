import { addSeconds } from 'date-fns';

import { getErrorMessage, isDefined, isEmptyArray } from '@rnw-community/shared';

import { BankSyncErrorCodeEnum } from '../enum/bank-sync-error-code.enum';
import { BankAccountInterface } from '../interface/bank-account.interface';
import { BankSyncBatchResultInterface } from '../interface/bank-sync-batch-result.interface';
import { BankTransactionInterface } from '../interface/bank-transaction.interface';
import { Log } from '../util/sync-logger.util';

import type { BankProviderClientInterface } from '../interface/bank-provider-client.interface';
import type { BankSyncOptionsInterface } from '../interface/bank-sync-options.interface';

const MAX_TRANSACTIONS_PER_REQUEST = 500;

export class BaseBankSyncService {
    constructor(
        protected readonly client: BankProviderClientInterface,
        protected readonly options: BankSyncOptionsInterface
    ) {}

    @Log(
        () => 'syncAccounts:start',
        accounts => `syncAccounts:done count=${accounts.length}`,
        error => `syncAccounts:throw error=${String(error)}`
    )
    async syncAccounts(): Promise<BankAccountInterface[]> {
        return this.fetchAccounts();
    }

    @Log(
        (_accountId, from) => `syncTransactionsForward:start from=${from.toISOString()}`,
        (result, accountId) =>
            `syncTransactionsForward:done accountId=${accountId} count=${result.transactions.length} completed=${String(result.completed)}`,
        (error, accountId) => `syncTransactionsForward:throw accountId=${accountId} error=${String(error)}`
    )
    async syncTransactionsForward(accountId: string, from: Date): Promise<BankSyncBatchResultInterface> {
        const to = new Date();
        const transactions = await this.fetchTransactions(accountId, from, to);

        const oldestTransaction = transactions.at(-1);

        if (this.hasMoreTransactions(transactions) && isDefined(oldestTransaction)) {
            return {
                nextFrom: this.getNextTimeFromTransaction(oldestTransaction),
                nextTo: to,
                transactions,
                completed: false
            };
        }

        return { nextFrom: to, nextTo: to, transactions, completed: true };
    }

    @Log(
        (_accountId, to) => `syncTransactionsBackward:start to=${to.toISOString()}`,
        (result, accountId) =>
            `syncTransactionsBackward:done accountId=${accountId} count=${result.transactions.length} completed=${String(result.completed)}`,
        (error, accountId) => `syncTransactionsBackward:throw accountId=${accountId} error=${String(error)}`
    )
    async syncTransactionsBackward(accountId: string, to: Date): Promise<BankSyncBatchResultInterface> {
        const from = addSeconds(to, -this.options.maxPeriodSeconds);
        const transactions = await this.fetchTransactions(accountId, from, to);
        const oldestTransaction = transactions.at(-1);

        if (this.hasMoreTransactions(transactions) && isDefined(oldestTransaction)) {
            return {
                nextTo: this.getNextTimeFromTransaction(oldestTransaction),
                nextFrom: from,
                transactions,
                completed: false
            };
        }

        return {
            nextTo: from,
            nextFrom: addSeconds(from, -this.options.maxPeriodSeconds),
            transactions,
            completed: isEmptyArray(transactions)
        };
    }

    protected toSeconds(date: Date): number {
        return Math.floor(date.getTime() / 1000);
    }

    protected delay(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    @Log(
        () => 'fetchAccounts:enter',
        accounts => `fetchAccounts:done count=${accounts.length}`,
        error => `fetchAccounts:throw error=${String(error)}`
    )
    private async fetchAccounts(): Promise<BankAccountInterface[]> {
        const result = await this.client.getAccounts();

        if (result.success) {
            return result.data;
        }

        throw new Error(`Failed to fetch accounts: ${result.error.code} ${result.error.message}`);
    }

    @Log(
        (accountId, from, to) => `fetchTransactions:enter accountId=${accountId} from=${from.toISOString()} to=${to.toISOString()}`,
        (transactions, accountId) => `fetchTransactions:done accountId=${accountId} count=${transactions.length}`,
        (error, accountId) => `fetchTransactions:throw accountId=${accountId} error=${String(error)}`
    )
    private async fetchTransactions(accountId: string, from: Date, to: Date): Promise<BankTransactionInterface[]> {
        const fromTs = this.toSeconds(from);
        const toTs = this.toSeconds(to);
        const result = await this.client.getTransactions(accountId, fromTs, toTs);

        if (result.success) {
            return result.data;
        }

        if (result.error.code === BankSyncErrorCodeEnum.INVALID_RESPONSE) {
            return [];
        }

        throw new Error(`Failed to fetch transactions ${getErrorMessage(result.error)}`);
    }

    private hasMoreTransactions(transactions: BankTransactionInterface[]): boolean {
        return transactions.length === MAX_TRANSACTIONS_PER_REQUEST;
    }

    private getNextTimeFromTransaction(transaction: BankTransactionInterface): Date {
        return addSeconds(new Date(transaction.time * 1000), -1);
    }
}
