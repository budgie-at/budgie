import { addSeconds } from 'date-fns';

import { getErrorMessage } from '@rnw-community/shared';

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

    async syncTransactionsBatch(accountId: string, to: Date): Promise<BankSyncBatchResultInterface> {
        const from = addSeconds(to, -this.options.maxPeriodSeconds);

        const result = await this.client.getTransactions(accountId, this.toSeconds(from), this.toSeconds(to));

        if (!result.success) {
            throw new Error(`Failed to fetch transactions ${getErrorMessage(result.error)}`);
        }

        return {
            transactions: result.data,
            nextTo: from,
            nextFrom: addSeconds(from, -this.options.maxPeriodSeconds),
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
