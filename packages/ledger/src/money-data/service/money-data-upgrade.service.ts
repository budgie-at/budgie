import { Db, TransactionEntryRepository, YIELD_TO_UI } from '@budgie/contracts';
import { EntryBaseValuationService, ExchangeRatesService } from '@budgie/market';
import { parseISO } from 'date-fns/parseISO';
import * as Arr from 'effect/Array';
import * as Cause from 'effect/Cause';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as SubscriptionRef from 'effect/SubscriptionRef';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';

import type { MoneyDataUpgradeRuntimeSnapshotInterface } from '../interface/money-data-upgrade-runtime-snapshot.interface';
import type { PendingBaseValuationBucketInterface } from '@budgie/contracts';

export class MoneyDataUpgradeService extends Context.Service<MoneyDataUpgradeService>()('@budgie/ledger/MoneyDataUpgradeService', {
    make: Effect.gen(function* () {
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const exchangeRatesService = yield* ExchangeRatesService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const reactivity = yield* Reactivity.Reactivity;
        const bucketBatchSize = 25;
        const initialSnapshot: MoneyDataUpgradeRuntimeSnapshotInterface = {
            isRunning: false,
            isUpdatingBalances: false,
            pendingEntryCount: 0,
            processedEntryCount: 0,
            totalEntryCount: 0,
            lastError: null
        };
        const progress = yield* SubscriptionRef.make(initialSnapshot);

        const updateProgress = (
            update: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => MoneyDataUpgradeRuntimeSnapshotInterface
        ): Effect.Effect<void> => SubscriptionRef.update(progress, update);

        const sumBucketEntries = (buckets: readonly PendingBaseValuationBucketInterface[]): number =>
            buckets.reduce((total, bucket) => total + bucket.entryCount, 0);

        const valuePendingEntryBucket = Effect.fnUntraced(function* (
            bucket: PendingBaseValuationBucketInterface,
            baseInstrumentId: number
        ) {
            const operatedAt = parseISO(bucket.rateDate);

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

            yield* updateProgress(snapshot => ({
                ...snapshot,
                pendingEntryCount: Math.max(snapshot.pendingEntryCount - bucket.entryCount, 0),
                processedEntryCount: snapshot.processedEntryCount + bucket.entryCount
            }));
        });

        const valuePendingEntryBatch = Effect.fn('MoneyDataUpgradeService.valuePendingEntryBatch')(function* (
            batch: readonly PendingBaseValuationBucketInterface[],
            baseInstrumentId: number
        ) {
            yield* Db.transaction(Effect.forEach(batch, bucket => valuePendingEntryBucket(bucket, baseInstrumentId), { discard: true }));

            yield* YIELD_TO_UI;
        });

        const valuePendingEntries = Effect.fn('MoneyDataUpgradeService.valuePendingEntries')(function* (
            missingBaseInstrumentMessage: string
        ) {
            const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

            if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
                return yield* Effect.die(new Error(missingBaseInstrumentMessage));
            }

            const buckets = yield* transactionEntryRepository.findPendingBaseValuationBuckets(baseInstrument.id);
            const totalEntryCount = sumBucketEntries(buckets);

            yield* updateProgress(snapshot => ({
                ...snapshot,
                pendingEntryCount: totalEntryCount,
                processedEntryCount: 0,
                totalEntryCount
            }));
            yield* Effect.forEach(Arr.chunksOf(buckets, bucketBatchSize), batch => valuePendingEntryBatch(batch, baseInstrument.id), {
                discard: true
            });
            yield* updateProgress(snapshot => ({ ...snapshot, isUpdatingBalances: true }));

            return yield* accountBalanceIncrementalService.updateAllBalances(true);
        });

        const readIdleSnapshot = Effect.fnUntraced(function* (missingBaseInstrumentMessage: string) {
            const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

            if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
                return { ...initialSnapshot, lastError: missingBaseInstrumentMessage };
            }

            const pendingEntryCount = yield* transactionEntryRepository.countPendingBaseValuationEntries(baseInstrument.id);

            return { ...initialSnapshot, pendingEntryCount, totalEntryCount: pendingEntryCount };
        });

        return {
            changes: SubscriptionRef.changes(progress),
            refreshSnapshot: Effect.fn('MoneyDataUpgradeService.refreshSnapshot')(function* (missingBaseInstrumentMessage: string) {
                const currentSnapshot = yield* SubscriptionRef.get(progress);

                if (currentSnapshot.isRunning) {
                    return currentSnapshot;
                }

                const idleSnapshot = yield* readIdleSnapshot(missingBaseInstrumentMessage);

                return yield* SubscriptionRef.modify(progress, snapshot =>
                    snapshot.isRunning ? [snapshot, snapshot] : [idleSnapshot, idleSnapshot]
                );
            }),
            run: Effect.fn('MoneyDataUpgradeService.run')(function* (missingBaseInstrumentMessage: string) {
                const isStarted = yield* SubscriptionRef.modify(progress, snapshot =>
                    snapshot.isRunning ? [false, snapshot] : [true, { ...initialSnapshot, isRunning: true }]
                );

                if (!isStarted) {
                    return yield* SubscriptionRef.get(progress);
                }

                yield* reactivity.withBatch(valuePendingEntries(missingBaseInstrumentMessage)).pipe(
                    Effect.tapCause(cause =>
                        updateProgress(snapshot => ({
                            ...snapshot,
                            isRunning: false,
                            isUpdatingBalances: false,
                            lastError: getErrorMessage(Cause.squash(cause))
                        }))
                    )
                );

                return yield* SubscriptionRef.updateAndGet(progress, snapshot => ({
                    ...snapshot,
                    isRunning: false,
                    isUpdatingBalances: false
                }));
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
