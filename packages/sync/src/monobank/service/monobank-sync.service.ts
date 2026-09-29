import { Log } from '@budgie/logger';
import { addMonths } from 'date-fns/addMonths';
import { addSeconds } from 'date-fns/addSeconds';
import { fromUnixTime } from 'date-fns/fromUnixTime';
import { getUnixTime } from 'date-fns/getUnixTime';
import { max } from 'date-fns/max';
import { min } from 'date-fns/min';

import { getErrorMessage, isDefined, isEmptyArray } from '@rnw-community/shared';

import { SyncErrorCodeEnum } from '../../core/enum/sync-error-code.enum';
import { MonobankClient } from '../client/monobank.client';
import { MONOBANK_MAX_PERIOD_SECONDS } from '../constant/monobank-max-period-seconds.constant';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncBatchResultInterface } from '../../core/interface/sync-batch-result.interface';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';

export class MonobankSyncService {
    private static readonly MAX_TRANSACTIONS_PER_REQUEST = 500;
    private static readonly DORMANCY_MONTHS = 3;

    private readonly client: MonobankClient;

    constructor(token: string) {
        this.client = new MonobankClient(token);
    }

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
        const to = min([now, addSeconds(from, MONOBANK_MAX_PERIOD_SECONDS)]);
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
        (accountId, to, firstEmptyFromInStreak, limitAt) =>
            `enter accountId=${accountId} to=${to.toISOString()} firstEmptyFromInStreak=${firstEmptyFromInStreak?.toISOString() ?? 'null'} limitAt=${limitAt?.toISOString() ?? 'null'}`,
        result => `done count=${result.transactions.length} completed=${String(result.completed)}`,
        (error, ...[accountId, to, firstEmptyFromInStreak, limitAt]) =>
            `throw accountId=${accountId} to=${to.toISOString()} firstEmptyFromInStreak=${firstEmptyFromInStreak?.toISOString() ?? 'null'} limitAt=${limitAt?.toISOString() ?? 'null'} error=${getErrorMessage(error)}`
    )
    async syncTransactionsBackward(
        accountId: string,
        to: Date,
        firstEmptyFromInStreak: Date | null,
        limitAt: Date | null
    ): Promise<SyncBatchResultInterface> {
        if (isDefined(limitAt) && to <= limitAt) {
            return { nextTo: to, nextFrom: to, transactions: [], completed: true };
        }

        const windowFrom = addSeconds(to, -MONOBANK_MAX_PERIOD_SECONDS);
        const from = isDefined(limitAt) ? max([windowFrom, limitAt]) : windowFrom;
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

        const reachedHistoryLimit = isDefined(limitAt) && from <= limitAt;
        const reachedDormancyBoundary =
            isEmptyArray(transactions) &&
            isDefined(firstEmptyFromInStreak) &&
            from <= addMonths(firstEmptyFromInStreak, -MonobankSyncService.DORMANCY_MONTHS);

        return {
            nextTo: from,
            nextFrom: addSeconds(from, -MONOBANK_MAX_PERIOD_SECONDS),
            transactions,
            completed: reachedHistoryLimit || reachedDormancyBoundary
        };
    }

    @Log('enter', jars => `done count=${jars.length}`, error => `throw error=${getErrorMessage(error)}`)
    async syncJars(): Promise<SyncAccountInterface[]> {
        const result = await this.client.getJars();

        if (result.success) {
            return result.data;
        }

        throw new Error(`Failed to fetch jars: ${result.error.code} ${result.error.message}`);
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
        const result = await this.client.getTransactions(accountId, getUnixTime(from), getUnixTime(to));

        if (result.success) {
            return result.data;
        }

        if (result.error.code === SyncErrorCodeEnum.INVALID_RESPONSE) {
            return [];
        }

        throw new Error(`Failed to fetch transactions ${getErrorMessage(result.error)}`);
    }

    private hasMoreTransactions(transactions: SyncTransactionInterface[]): boolean {
        return transactions.length === MonobankSyncService.MAX_TRANSACTIONS_PER_REQUEST;
    }

    private getNextTimeFromTransaction(transaction: SyncTransactionInterface): Date {
        return addSeconds(fromUnixTime(transaction.time), -1);
    }
}
