import { Log } from '@budgie/logger';
import { addSeconds, fromUnixTime, getUnixTime } from 'date-fns';

import { getErrorMessage, isDefined, isEmptyArray } from '@rnw-community/shared';

import { BankSyncErrorCodeEnum } from '../enum/bank-sync-error-code.enum';
import { BankAccountInterface } from '../interface/bank-account.interface';
import { BankSyncBatchResultInterface } from '../interface/bank-sync-batch-result.interface';
import { BankTransactionInterface } from '../interface/bank-transaction.interface';

import type { BackwardSweepWindowResultInterface } from '../interface/backward-sweep-window-result.interface';
import type { BankProviderClientInterface } from '../interface/bank-provider-client.interface';
import type { BankSyncOptionsInterface } from '../interface/bank-sync-options.interface';

export class BaseBankSyncService {
    private static readonly MAX_TRANSACTIONS_PER_REQUEST = 500;

    constructor(
        protected readonly client: BankProviderClientInterface,
        protected readonly options: BankSyncOptionsInterface
    ) {}

    @Log('enter', accounts => `done count=${accounts.length}`, error => `throw error=${getErrorMessage(error)}`)
    async syncAccounts(): Promise<BankAccountInterface[]> {
        return this.fetchAccounts();
    }

    @Log(
        (accountId, from) => `enter accountId=${accountId} from=${from.toISOString()}`,
        result => `done count=${result.transactions.length} completed=${String(result.completed)}`,
        (error, accountId, from) => `throw accountId=${accountId} from=${from.toISOString()} error=${getErrorMessage(error)}`
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
        (accountId, to, previousEmptyWindowCount, previousBackwardSyncedAt) =>
            `enter accountId=${accountId} to=${to.toISOString()} previousEmptyWindowCount=${previousEmptyWindowCount} previousBackwardSyncedAt=${previousBackwardSyncedAt?.toISOString() ?? 'null'}`,
        result =>
            `done count=${result.transactions.length} completed=${String(result.completed)} nextEmptyWindowCount=${result.nextEmptyWindowCount}`,
        // eslint-disable-next-line @typescript-eslint/max-params -- Existing public API and Log hooks intentionally keep positional arguments
        (error, accountId, to, previousEmptyWindowCount, previousBackwardSyncedAt) =>
            `throw accountId=${accountId} to=${to.toISOString()} previousEmptyWindowCount=${previousEmptyWindowCount} previousBackwardSyncedAt=${previousBackwardSyncedAt?.toISOString() ?? 'null'} error=${getErrorMessage(error)}`
    )
    async syncTransactionsBackward(
        accountId: string,
        to: Date,
        previousEmptyWindowCount: number,
        previousBackwardSyncedAt: Date | null
    ): Promise<BackwardSweepWindowResultInterface> {
        const from = addSeconds(to, -this.options.maxPeriodSeconds);
        const effectiveFloor =
            isDefined(previousBackwardSyncedAt) && previousBackwardSyncedAt > this.options.historicalFloor
                ? previousBackwardSyncedAt
                : this.options.historicalFloor;

        const transactions = await this.fetchTransactions(accountId, from, to);
        const oldestTransaction = transactions.at(-1);

        if (this.hasMoreTransactions(transactions) && isDefined(oldestTransaction)) {
            return {
                nextTo: this.getNextTimeFromTransaction(oldestTransaction),
                nextFrom: from,
                transactions,
                completed: false,
                nextEmptyWindowCount: 0
            };
        }

        const nextFrom = addSeconds(from, -this.options.maxPeriodSeconds);

        if (isEmptyArray(transactions)) {
            const nextEmptyWindowCount = previousEmptyWindowCount + 1;
            const completed = nextEmptyWindowCount >= this.options.maxEmptyWindowsBeforeStop || from <= effectiveFloor;

            return {
                nextTo: from,
                nextFrom,
                transactions,
                completed,
                nextEmptyWindowCount
            };
        }

        return {
            nextTo: from,
            nextFrom,
            transactions,
            completed: from <= effectiveFloor,
            nextEmptyWindowCount: 0
        };
    }

    @Log('enter', accounts => `done count=${accounts.length}`, error => `throw error=${getErrorMessage(error)}`)
    private async fetchAccounts(): Promise<BankAccountInterface[]> {
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

    protected toSeconds(date: Date): number {
        return getUnixTime(date);
    }

    private hasMoreTransactions(transactions: BankTransactionInterface[]): boolean {
        return transactions.length === BaseBankSyncService.MAX_TRANSACTIONS_PER_REQUEST;
    }

    private getNextTimeFromTransaction(transaction: BankTransactionInterface): Date {
        return addSeconds(fromUnixTime(transaction.time), -1);
    }
}
