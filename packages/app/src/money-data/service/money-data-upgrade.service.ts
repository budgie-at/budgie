import { Db, TransactionEntryRepository } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { ExchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

import { EntryBaseValuationService } from './entry-base-valuation.service';

import type { MoneyDataUpgradeRuntimeSnapshotInterface } from '../interface/money-data-upgrade-runtime-snapshot.interface';
import type { PendingBaseValuationBucketInterface } from '@budgie/contracts';

export class MoneyDataUpgradeService extends Context.Service<MoneyDataUpgradeService>()('@budgie/app/MoneyDataUpgradeService', {
    make: Effect.gen(function* () {
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const exchangeRatesService = yield* ExchangeRatesService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const reactivity = yield* Reactivity.Reactivity;
        const bucketBatchSize = 25;

        const createInitialSnapshot = (): MoneyDataUpgradeRuntimeSnapshotInterface => ({
            isRunning: false,
            isUpdatingBalances: false,
            pendingEntryCount: 0,
            processedEntryCount: 0,
            totalEntryCount: 0,
            lastError: null
        });

        let snapshot = createInitialSnapshot();

        const publishSnapshot = (
            nextSnapshot: MoneyDataUpgradeRuntimeSnapshotInterface,
            onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
        ): void => {
            snapshot = nextSnapshot;
            onProgress?.(nextSnapshot);
        };

        const sumBucketEntries = (buckets: PendingBaseValuationBucketInterface[]): number =>
            buckets.reduce((total, bucket) => total + bucket.entryCount, 0);

        const toBucketBatches = (buckets: PendingBaseValuationBucketInterface[]): PendingBaseValuationBucketInterface[][] => {
            const batches: PendingBaseValuationBucketInterface[][] = [];

            for (let batchStart = 0; batchStart < buckets.length; batchStart += bucketBatchSize) {
                batches.push(buckets.slice(batchStart, batchStart + bucketBatchSize));
            }

            return batches;
        };

        const valuePendingEntryBucket = Effect.fnUntraced(function* (
            bucket: PendingBaseValuationBucketInterface,
            baseInstrumentId: number,
            onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
        ) {
            const operatedAt = new Date(bucket.rateDate);
            operatedAt.setHours(0, 0, 0, 0);

            const baseExchangeRate =
                bucket.sourceInstrumentId === baseInstrumentId
                    ? 1
                    : yield* entryBaseValuationService.resolveHistoricalBaseExchangeRateOrNull(
                          bucket.sourceInstrumentId,
                          baseInstrumentId,
                          operatedAt
                      );

            yield* transactionEntryRepository.updateBaseValuationBucket({
                rateDate: bucket.rateDate,
                sourceInstrumentId: bucket.sourceInstrumentId,
                baseInstrumentId,
                baseExchangeRate
            });

            publishSnapshot(
                {
                    ...snapshot,
                    pendingEntryCount: Math.max(snapshot.pendingEntryCount - bucket.entryCount, 0),
                    processedEntryCount: snapshot.processedEntryCount + bucket.entryCount
                },
                onProgress
            );
        });

        const valuePendingEntryBatch = Effect.fn('MoneyDataUpgradeService.valuePendingEntryBatch')(function* (
            batch: PendingBaseValuationBucketInterface[],
            baseInstrumentId: number,
            onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
        ) {
            yield* Db.transaction(
                Effect.forEach(batch, bucket => valuePendingEntryBucket(bucket, baseInstrumentId, onProgress), { discard: true })
            );

            yield* YIELD_TO_UI;
        });

        const valuePendingEntries = Effect.fn('MoneyDataUpgradeService.valuePendingEntries')(function* (
            onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
        ) {
            const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

            if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
                return yield* Effect.die(new Error(t`Base instrument not found`));
            }

            const buckets = yield* transactionEntryRepository.findPendingBaseValuationBuckets(baseInstrument.id);
            const totalEntryCount = sumBucketEntries(buckets);

            publishSnapshot(
                {
                    ...snapshot,
                    pendingEntryCount: totalEntryCount,
                    processedEntryCount: 0,
                    totalEntryCount
                },
                onProgress
            );

            yield* Effect.forEach(toBucketBatches(buckets), batch => valuePendingEntryBatch(batch, baseInstrument.id, onProgress), {
                discard: true
            });

            publishSnapshot({ ...snapshot, isUpdatingBalances: true }, onProgress);

            return yield* accountBalanceIncrementalService.updateAllBalances(true);
        });

        return {
            getSnapshot: Effect.fn('MoneyDataUpgradeService.getSnapshot')(function* () {
                if (snapshot.isRunning) {
                    return snapshot;
                }

                const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

                if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
                    const missingBaseSnapshot: MoneyDataUpgradeRuntimeSnapshotInterface = {
                        ...createInitialSnapshot(),
                        lastError: t`Base instrument not found`
                    };

                    return missingBaseSnapshot;
                }

                const pendingEntryCount = yield* transactionEntryRepository.countPendingBaseValuationEntries(baseInstrument.id);
                const pendingSnapshot: MoneyDataUpgradeRuntimeSnapshotInterface = {
                    ...createInitialSnapshot(),
                    pendingEntryCount,
                    totalEntryCount: pendingEntryCount
                };

                return pendingSnapshot;
            }),
            run: Effect.fn('MoneyDataUpgradeService.run')(function* (
                onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
            ) {
                if (snapshot.isRunning) {
                    return snapshot;
                }

                publishSnapshot({ ...snapshot, isRunning: true, lastError: null }, onProgress);

                yield* reactivity.withBatch(valuePendingEntries(onProgress)).pipe(
                    Effect.tapCause(cause =>
                        Effect.sync(() => {
                            publishSnapshot(
                                {
                                    ...snapshot,
                                    isRunning: false,
                                    isUpdatingBalances: false,
                                    lastError: getErrorMessage(Cause.squash(cause))
                                },
                                onProgress
                            );
                        })
                    )
                );
                publishSnapshot({ ...snapshot, isRunning: false, isUpdatingBalances: false }, onProgress);

                return snapshot;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(MoneyDataUpgradeService, MoneyDataUpgradeService.make).pipe(
        Layer.provide([
            TransactionEntryRepository.layer,
            ExchangeRatesService.layer,
            AccountBalanceIncrementalService.layer,
            EntryBaseValuationService.layer
        ])
    );
}
