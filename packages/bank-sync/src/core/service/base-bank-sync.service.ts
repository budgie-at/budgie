import { addSeconds } from 'date-fns';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { BankAccountInterface } from '../interface/bank-account.interface';
import { BankSyncBatchResultInterface } from '../interface/bank-sync-batch-result.interface';

import type { BankProviderClientInterface } from '../interface/bank-provider-client.interface';
import type { BankSyncOptionsInterface } from '../interface/bank-sync-options.interface';

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

    async syncTransactions(accountId: string, to: Date): Promise<BankSyncBatchResultInterface> {
        const from = addSeconds(to, -this.options.maxPeriodSeconds);

        const result = await this.client.getTransactions(accountId, this.toSeconds(from), this.toSeconds(to));

        if (!result.success) {
            console.log('Failed sync', { from, to, error: result.error });
            throw new Error(`Failed to fetch transactions ${getErrorMessage(result.error)}`);
        }

        const maxTransactionsPerRequest = 500;
        const hasMoreInPeriod = result.data.length === maxTransactionsPerRequest;

        const lastTransaction = result.data.at(-1);
        const lastTransactionDate = isDefined(lastTransaction) ? addSeconds(new Date(lastTransaction.time * 1000), -1) : null;

        console.log('Success sync', { to, from, lastTransaction, lastTransactionDate });

        if (hasMoreInPeriod && isDefined(lastTransactionDate)) {
            return {
                // HINT: Maybe we should get a first transaction
                nextTo: lastTransactionDate,
                nextFrom: from,
                transactions: result.data,
                completed: false
            };
        }

        const nextTo = !isDefined(lastTransactionDate) || Number.isNaN(lastTransactionDate) ? from : lastTransactionDate;

        return {
            nextTo,
            nextFrom: addSeconds(nextTo, -this.options.maxPeriodSeconds),
            transactions: result.data,
            completed: result.data.length === 0
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
}
