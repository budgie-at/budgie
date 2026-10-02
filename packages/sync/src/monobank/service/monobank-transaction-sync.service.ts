import { addMonths } from 'date-fns/addMonths';
import { addSeconds } from 'date-fns/addSeconds';
import { fromUnixTime } from 'date-fns/fromUnixTime';
import { getUnixTime } from 'date-fns/getUnixTime';
import { max } from 'date-fns/max';
import { min } from 'date-fns/min';
import * as Effect from 'effect/Effect';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { MONOBANK_MAX_PERIOD_SECONDS } from '../constant/monobank-max-period-seconds.constant';

import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { MonobankClient } from '../client/monobank.client';

export class MonobankTransactionSyncService {
    private static readonly MAX_TRANSACTIONS_PER_REQUEST = 500;
    private static readonly DORMANCY_MONTHS = 3;

    readonly syncTransactionsForward = Effect.fn('MonobankTransactionSyncService.syncTransactionsForward')(function* (
        this: MonobankTransactionSyncService,
        accountId: string,
        from: Date
    ) {
        const now = new Date();
        const to = min([now, addSeconds(from, MONOBANK_MAX_PERIOD_SECONDS)]);
        const transactions = yield* this.fetchTransactions(accountId, from, to);
        const oldestTransaction = transactions.at(-1);

        if (this.hasMoreTransactions(transactions) && isDefined(oldestTransaction)) {
            return {
                nextFrom: this.getNextTimeFromTransaction(oldestTransaction),
                nextTo: to,
                transactions,
                completed: false
            };
        }

        return { nextFrom: to, nextTo: to, transactions, completed: to >= now };
    });

    constructor(private readonly client: MonobankClient) {}

    syncTransactionsBackward(accountId: string, to: Date, firstEmptyFromInStreak: Date | null, limitAt: Date | null) {
        return Effect.gen({ self: this }, function* (this: MonobankTransactionSyncService) {
            if (isDefined(limitAt) && to <= limitAt) {
                return { nextTo: to, nextFrom: to, transactions: [], completed: true };
            }

            const windowFrom = addSeconds(to, -MONOBANK_MAX_PERIOD_SECONDS);
            const from = isDefined(limitAt) ? max([windowFrom, limitAt]) : windowFrom;
            const transactions = yield* this.fetchTransactions(accountId, from, to);
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
                from <= addMonths(firstEmptyFromInStreak, -MonobankTransactionSyncService.DORMANCY_MONTHS);

            return {
                nextTo: from,
                nextFrom: addSeconds(from, -MONOBANK_MAX_PERIOD_SECONDS),
                transactions,
                completed: reachedHistoryLimit || reachedDormancyBoundary
            };
        });
    }

    private fetchTransactions(accountId: string, from: Date, to: Date) {
        return this.client
            .getTransactions(accountId, getUnixTime(from), getUnixTime(to))
            .pipe(Effect.catchTag('SyncInvalidResponseError', () => Effect.succeed<SyncTransactionInterface[]>([])));
    }

    private hasMoreTransactions(transactions: SyncTransactionInterface[]): boolean {
        return transactions.length === MonobankTransactionSyncService.MAX_TRANSACTIONS_PER_REQUEST;
    }

    private getNextTimeFromTransaction(transaction: SyncTransactionInterface): Date {
        return addSeconds(fromUnixTime(transaction.time), -1);
    }
}
