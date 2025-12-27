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

    async syncTransactionsBatch(accountId: string, fromTime: number, toTime: number): Promise<BankSyncBatchResultInterface> {
        const periodFromTime = Math.max(toTime - this.options.maxPeriodSeconds, fromTime);
        const result = await this.client.getTransactions(accountId, periodFromTime, toTime);

        if (!result.success) {
            throw new Error('Failed to fetch transactions');
        }

        return {
            transactions: result.data,
            nextToTime: periodFromTime,
            completed: periodFromTime <= fromTime
        };
    }

    protected delay(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}
