import { addSeconds } from 'date-fns';

import { getErrorMessage, isDefined, isEmptyArray } from '@rnw-community/shared';

import { BankSyncErrorCodeEnum } from '../enum/bank-sync-error-code.enum';
import { BankAccountInterface } from '../interface/bank-account.interface';
import { BankSyncBatchResultInterface } from '../interface/bank-sync-batch-result.interface';
import { BankTransactionInterface } from '../interface/bank-transaction.interface';

import type { BankProviderClientInterface } from '../interface/bank-provider-client.interface';
import type { BankSyncOptionsInterface } from '../interface/bank-sync-options.interface';

const MAX_TRANSACTIONS_PER_REQUEST = 500;

export class BaseBankSyncService {
    constructor(
        protected readonly client: BankProviderClientInterface,
        protected readonly options: BankSyncOptionsInterface
    ) {}

    async syncAccounts(): Promise<BankAccountInterface[]> {
        const result = await this.client.getAccounts();

        if (result.success) {
            return result.data;
        }

        return [];
    }

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

    private async fetchTransactions(accountId: string, from: Date, to: Date): Promise<BankTransactionInterface[]> {
        // eslint-disable-next-line no-console
        console.log(`[BankSync:API] Fetching transactions accountId=${accountId} from=${this.toSeconds(from)} to=${this.toSeconds(to)}`);
        const result = await this.client.getTransactions(accountId, this.toSeconds(from), this.toSeconds(to));

        if (result.success) {
            // eslint-disable-next-line no-console
            console.log(`[BankSync:API] Success: ${result.data.length} transactions`);

            return result.data;
        }

        // eslint-disable-next-line no-console
        console.error(`[BankSync:API] Error: code=${result.error.code} message=${getErrorMessage(result.error)}`);

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
