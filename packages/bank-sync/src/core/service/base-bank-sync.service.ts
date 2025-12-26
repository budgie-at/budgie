/* eslint-disable no-await-in-loop */
import { isNotEmptyArray } from '@rnw-community/shared';

import { BankAccountInterface } from '../interface/bank-account.interface';

import type { BankProviderClientInterface } from '../interface/bank-provider-client.interface';
import type { BankSyncOptionsInterface } from '../interface/bank-sync-options.interface';
import type { BankTransactionInterface } from '../interface/bank-transaction.interface';

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

    async *syncTransactions(accountId: string, fromDate: Date | null = new Date(0)): AsyncGenerator<BankTransactionInterface[]> {
        const allTransactions: BankTransactionInterface[] = [];
        const fromTime = (fromDate ?? new Date(0)).getTime() / 1000;
        let toTime = Math.floor(Date.now() / 1000);

        do {
            const periodFromTime = Math.max(toTime - this.options.maxPeriodSeconds, fromTime);

            const result = await this.client.getTransactions(accountId, periodFromTime, toTime);

            if (!result.success || !isNotEmptyArray(result.data)) {
                break;
            }

            yield result.data;

            toTime = periodFromTime;

            await this.delay(this.options.rateLimitMs);
        } while (toTime > fromTime);

        return allTransactions;
    }

    protected delay(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}
