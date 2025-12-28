import { addSeconds } from 'date-fns';

import { getErrorMessage, isDefined, isEmptyArray } from '@rnw-community/shared';

import { BankSyncErrorCodeEnum } from '../enum/bank-sync-error-code.enum';
import { BankAccountInterface } from '../interface/bank-account.interface';
import { BankSyncBatchResultInterface } from '../interface/bank-sync-batch-result.interface';

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

        return await this.syncTransactions(accountId, from, to, 'forward');
    }

    async syncTransactionsBackward(accountId: string, to: Date): Promise<BankSyncBatchResultInterface> {
        const from = addSeconds(to, -this.options.maxPeriodSeconds);

        return await this.syncTransactions(accountId, from, to, 'backward');
    }

    protected toSeconds(date: Date): number {
        return Math.floor(date.getTime() / 1000);
    }

    protected delay(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    private async syncTransactions(accountId: string, from: Date, to: Date, direction: 'forward' | 'backward') {
        const result = await this.client.getTransactions(accountId, this.toSeconds(from), this.toSeconds(to));
        const isForward = direction === 'forward';

        if (!result.success) {
            // HINT: For wrong dates API returns 400 instead
            if (result.error.code === BankSyncErrorCodeEnum.INVALID_RESPONSE) {
                return {
                    nextTo: to,
                    nextFrom: from,
                    transactions: [],
                    completed: true
                };
            }

            throw new Error(`Failed to fetch transactions ${getErrorMessage(result.error)}`);
        }

        const hasMoreInPeriod = result.data.length === MAX_TRANSACTIONS_PER_REQUEST;
        const oldestTransaction = result.data.at(-1);

        if (hasMoreInPeriod && isDefined(oldestTransaction)) {
            return {
                nextFrom: addSeconds(new Date(oldestTransaction.time * 1000), -1),
                nextTo: to,
                transactions: result.data,
                completed: false
            };
        }

        return {
            nextFrom: to,
            transactions: result.data,
            completed: isForward ? true : isEmptyArray(result.data),
            nextTo: isForward ? to : addSeconds(from, -this.options.maxPeriodSeconds)
        };
    }
}
