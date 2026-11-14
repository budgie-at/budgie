import { convertToMicroUnits, SyncModeEnum, TransactionEntryTypeEnum, TransactionRepository } from '@budgie/contracts';
import { millisecondsInDay, millisecondsInSecond } from 'date-fns/constants';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { SyncTransactionTypeEnum } from '../enum/sync-transaction-type.enum';

import type { SyncTransactionInterface } from '../interface/sync-transaction.interface';
import type { ExternalSourceEnum, SyncEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

export class FileImportDeliveredRowService extends Context.Service<FileImportDeliveredRowService>()(
    '@budgie/sync/FileImportDeliveredRowService',
    {
        make: Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const BOOKING_LAG_MS = 3 * millisecondsInDay;

            const toTimeMs = (transaction: SyncTransactionInterface) => transaction.time * millisecondsInSecond;

            const toEntryKey = (type: TransactionEntryTypeEnum, amount: number) => `${type}:${amount}`;

            const toFileEntryKey = (transaction: SyncTransactionInterface) =>
                toEntryKey(
                    transaction.type === SyncTransactionTypeEnum.INCOME ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                    convertToMicroUnits(Math.abs(transaction.amount))
                );

            const findBookedLater = (
                liveEntries: readonly Pick<TransactionEntryEntityInterface, 'type' | 'amount'>[],
                transactions: readonly SyncTransactionInterface[],
                liveFromMs: number
            ) => {
                const unmatchedLiveCounts = new Map<string, number>();
                for (const { type, amount } of liveEntries) {
                    const key = toEntryKey(type, amount);
                    unmatchedLiveCounts.set(key, (unmatchedLiveCounts.get(key) ?? 0) + 1);
                }
                for (const transaction of transactions.filter(
                    row => toTimeMs(row) >= liveFromMs && toTimeMs(row) < liveFromMs + BOOKING_LAG_MS
                )) {
                    const key = toFileEntryKey(transaction);
                    unmatchedLiveCounts.set(key, (unmatchedLiveCounts.get(key) ?? 0) - 1);
                }

                const bookedLater = new Set<SyncTransactionInterface>();
                const candidates = transactions
                    .filter(row => toTimeMs(row) < liveFromMs && toTimeMs(row) >= liveFromMs - BOOKING_LAG_MS)
                    .sort((left, right) => right.time - left.time);
                for (const transaction of candidates) {
                    const key = toFileEntryKey(transaction);
                    const unmatchedCount = unmatchedLiveCounts.get(key) ?? 0;
                    if (isPositiveNumber(unmatchedCount)) {
                        unmatchedLiveCounts.set(key, unmatchedCount - 1);
                        bookedLater.add(transaction);
                    }
                }

                return bookedLater;
            };

            return {
                resolveIsDelivered: Effect.fn('FileImportDeliveredRowService.resolveIsDelivered')(function* (
                    importProvider: ExternalSourceEnum,
                    accountId: number,
                    sync: SyncEntityInterface | undefined,
                    transactions: readonly SyncTransactionInterface[]
                ) {
                    if (!isDefined(sync)) {
                        return () => false;
                    }

                    const { backwardSyncLimitAt, forwardSyncFromAt, mode, provider } = sync;
                    if (provider === importProvider) {
                        return (transaction: SyncTransactionInterface) =>
                            isDefined(backwardSyncLimitAt) &&
                            isDefined(forwardSyncFromAt) &&
                            toTimeMs(transaction) >= backwardSyncLimitAt.getTime() &&
                            toTimeMs(transaction) < forwardSyncFromAt.getTime();
                    }

                    if (mode === SyncModeEnum.BACKWARD) {
                        return (transaction: SyncTransactionInterface) =>
                            !isDefined(backwardSyncLimitAt) || toTimeMs(transaction) >= backwardSyncLimitAt.getTime();
                    }

                    const earliestLiveAt = yield* transactionRepository.getEarliestTransactionTimeByAccountIdAndSource(accountId, provider);
                    const earliestDeliveredAt = earliestLiveAt ?? forwardSyncFromAt;
                    if (!isDefined(earliestDeliveredAt)) {
                        return () => false;
                    }

                    const liveFrom = DateTime.startOf(DateTime.fromDateUnsafe(earliestDeliveredAt), 'day');
                    const liveFromMs = DateTime.toEpochMillis(liveFrom);
                    const liveEntries = yield* transactionRepository.findPrimaryEntriesByAccountIdAndSourceBetween(
                        accountId,
                        provider,
                        DateTime.toDateUtc(liveFrom),
                        DateTime.toDateUtc(DateTime.add(liveFrom, { milliseconds: BOOKING_LAG_MS }))
                    );
                    const bookedLater = findBookedLater(liveEntries, transactions, liveFromMs);

                    return (transaction: SyncTransactionInterface) => toTimeMs(transaction) >= liveFromMs || bookedLater.has(transaction);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(FileImportDeliveredRowService, FileImportDeliveredRowService.make).pipe(
        Layer.provide(TransactionRepository.layer)
    );
}
