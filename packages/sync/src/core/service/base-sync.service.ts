import { Log } from '@budgie/logger';
import { addMonths, addSeconds, fromUnixTime, getUnixTime, min } from 'date-fns';

import { getErrorMessage, isDefined, isEmptyArray } from '@rnw-community/shared';

import { SyncErrorCodeEnum } from '../enum/sync-error-code.enum';
import { SyncAccountInterface } from '../interface/sync-account.interface';
import { SyncBatchResultInterface } from '../interface/sync-batch-result.interface';
import { SyncTransactionInterface } from '../interface/sync-transaction.interface';

import type { SyncOptionsInterface } from '../interface/sync-options.interface';
import type { SyncProviderClientInterface } from '../interface/sync-provider-client.interface';

export class BaseSyncService {
    private static readonly MAX_TRANSACTIONS_PER_REQUEST = 500;

    constructor(
        protected readonly client: SyncProviderClientInterface,
        protected readonly options: SyncOptionsInterface
    ) {}

    @Log('enter', accounts => `done count=${accounts.length}`, error => `throw error=${getErrorMessage(error)}`)
    async syncAccounts(): Promise<SyncAccountInterface[]> {
        return this.fetchAccounts();
    }

    @Log(
        (accountId, from) => `enter accountId=${accountId} from=${from.toISOString()}`,
        result => `done count=${result.transactions.length} completed=${String(result.completed)}`,
        (error, accountId, from) => `throw accountId=${accountId} from=${from.toISOString()} error=${getErrorMessage(error)}`
    )
    async syncTransactionsForward(accountId: string, from: Date): Promise<SyncBatchResultInterface> {
        const now = new Date();
        const to = min([now, addSeconds(from, this.options.maxPeriodSeconds)]);
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

        const windowWasCapped = to < now;

        return { nextFrom: to, nextTo: to, transactions, completed: !windowWasCapped };
    }

    @Log(
        (accountId, to, firstEmptyFromInStreak) =>
            `enter accountId=${accountId} to=${to.toISOString()} firstEmptyFromInStreak=${firstEmptyFromInStreak?.toISOString() ?? 'null'}`,
        result => `done count=${result.transactions.length} completed=${String(result.completed)}`,
        (error, accountId, to, firstEmptyFromInStreak) =>
            `throw accountId=${accountId} to=${to.toISOString()} firstEmptyFromInStreak=${firstEmptyFromInStreak?.toISOString() ?? 'null'} error=${getErrorMessage(error)}`
    )
    async syncTransactionsBackward(accountId: string, to: Date, firstEmptyFromInStreak: Date | null): Promise<SyncBatchResultInterface> {
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

        const reachedDormancyBoundary =
            isEmptyArray(transactions) &&
            isDefined(firstEmptyFromInStreak) &&
            from <= addMonths(firstEmptyFromInStreak, -this.options.dormancyMonths);

        return {
            nextTo: from,
            nextFrom: addSeconds(from, -this.options.maxPeriodSeconds),
            transactions,
            completed: reachedDormancyBoundary
        };
    }

    @Log('enter', accounts => `done count=${accounts.length}`, error => `throw error=${getErrorMessage(error)}`)
    private async fetchAccounts(): Promise<SyncAccountInterface[]> {
        const result = await this.client.getAccounts();

        if (result.success) {
            return result.data;
        }

        throw new Error(`Failed to fetch accounts: ${result.error.code} ${result.error.message}`);
    }

    @Log(
        (accountId, from, to) => `enter accountId=${accountId} from=${from.toISOString()} to=${to.toISOString()}`,
        result => `done count=${result.length}`,
        (error, accountId, from, to) =>
            `throw accountId=${accountId} from=${from.toISOString()} to=${to.toISOString()} error=${getErrorMessage(error)}`
    )
    private async fetchTransactions(accountId: string, from: Date, to: Date): Promise<SyncTransactionInterface[]> {
        const fromTs = this.toSeconds(from);
        const toTs = this.toSeconds(to);
        const result = await this.client.getTransactions(accountId, fromTs, toTs);

        if (result.success) {
            return result.data;
        }

        if (result.error.code === SyncErrorCodeEnum.INVALID_RESPONSE) {
            return [];
        }

        throw new Error(`Failed to fetch transactions ${getErrorMessage(result.error)}`);
    }

    protected toSeconds(date: Date): number {
        return getUnixTime(date);
    }

    private hasMoreTransactions(transactions: SyncTransactionInterface[]): boolean {
        return transactions.length === BaseSyncService.MAX_TRANSACTIONS_PER_REQUEST;
    }

    private getNextTimeFromTransaction(transaction: SyncTransactionInterface): Date {
        return addSeconds(fromUnixTime(transaction.time), -1);
    }
}
