import { Db } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import { transactionEntryRepository } from '../../@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

import { entryBaseValuationService } from './entry-base-valuation.service';

import type { MoneyDataUpgradeRuntimeSnapshotInterface } from '../interface/money-data-upgrade-runtime-snapshot.interface';
import type { PendingBaseValuationBucketInterface } from '@budgie/contracts';

class MoneyDataUpgradeService {
    private static readonly BUCKET_BATCH_SIZE = 25;

    readonly getSnapshot = Effect.fn('MoneyDataUpgradeService.getSnapshot')(function* (this: MoneyDataUpgradeService) {
        if (this.snapshot.isRunning) {
            return this.snapshot;
        }

        const baseInstrument = yield* exchangeRatesService.getBaseInstrument();
        if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
            const missingBaseSnapshot: MoneyDataUpgradeRuntimeSnapshotInterface = {
                ...this.createInitialSnapshot(),
                lastError: t`Base instrument not found`
            };

            return missingBaseSnapshot;
        }

        const pendingEntryCount = yield* transactionEntryRepository.countPendingBaseValuationEntries(baseInstrument.id);
        const pendingSnapshot: MoneyDataUpgradeRuntimeSnapshotInterface = {
            ...this.createInitialSnapshot(),
            pendingEntryCount,
            totalEntryCount: pendingEntryCount
        };

        return pendingSnapshot;
    });

    readonly run = Effect.fn('MoneyDataUpgradeService.run')(function* (
        this: MoneyDataUpgradeService,
        onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
    ) {
        if (this.snapshot.isRunning) {
            return this.snapshot;
        }

        this.publishSnapshot({ ...this.snapshot, isRunning: true, lastError: null }, onProgress);

        yield* this.valuePendingEntries(onProgress).pipe(
            Effect.tapCause(cause =>
                Effect.sync(() => {
                    this.publishSnapshot(
                        { ...this.snapshot, isRunning: false, isUpdatingBalances: false, lastError: getErrorMessage(Cause.squash(cause)) },
                        onProgress
                    );
                })
            )
        );
        this.publishSnapshot({ ...this.snapshot, isRunning: false, isUpdatingBalances: false }, onProgress);

        return this.snapshot;
    });

    private snapshot: MoneyDataUpgradeRuntimeSnapshotInterface = this.createInitialSnapshot();

    private readonly valuePendingEntries = Effect.fn('MoneyDataUpgradeService.valuePendingEntries')(function* (
        this: MoneyDataUpgradeService,
        onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
    ) {
        const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

        if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
            return yield* Effect.die(new Error(t`Base instrument not found`));
        }

        const buckets = yield* transactionEntryRepository.findPendingBaseValuationBuckets(baseInstrument.id);
        const totalEntryCount = this.sumBucketEntries(buckets);

        this.publishSnapshot(
            {
                ...this.snapshot,
                pendingEntryCount: totalEntryCount,
                processedEntryCount: 0,
                totalEntryCount
            },
            onProgress
        );

        yield* Effect.forEach(this.toBucketBatches(buckets), batch => this.valuePendingEntryBatch(batch, baseInstrument.id, onProgress), {
            discard: true
        });

        this.publishSnapshot(
            {
                ...this.snapshot,
                isUpdatingBalances: true
            },
            onProgress
        );

        return yield* accountBalanceIncrementalService.updateAllBalances(true);
    });

    private readonly valuePendingEntryBatch = Effect.fn('MoneyDataUpgradeService.valuePendingEntryBatch')(function* (
        this: MoneyDataUpgradeService,
        batch: PendingBaseValuationBucketInterface[],
        baseInstrumentId: number,
        onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
    ) {
        yield* Db.transaction(Effect.forEach(batch, bucket => this.valuePendingEntryBucket(bucket, baseInstrumentId), { discard: true }));

        const batchEntryCount = this.sumBucketEntries(batch);
        this.publishSnapshot(
            {
                ...this.snapshot,
                pendingEntryCount: Math.max(this.snapshot.pendingEntryCount - batchEntryCount, 0),
                processedEntryCount: this.snapshot.processedEntryCount + batchEntryCount
            },
            onProgress
        );

        yield* YIELD_TO_UI;
    });

    private readonly valuePendingEntryBucket = Effect.fn('MoneyDataUpgradeService.valuePendingEntryBucket')(function* (
        bucket: PendingBaseValuationBucketInterface,
        baseInstrumentId: number
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
    });

    private toBucketBatches(buckets: PendingBaseValuationBucketInterface[]): PendingBaseValuationBucketInterface[][] {
        const batches: PendingBaseValuationBucketInterface[][] = [];

        for (let batchStart = 0; batchStart < buckets.length; batchStart += MoneyDataUpgradeService.BUCKET_BATCH_SIZE) {
            batches.push(buckets.slice(batchStart, batchStart + MoneyDataUpgradeService.BUCKET_BATCH_SIZE));
        }

        return batches;
    }

    private sumBucketEntries(buckets: PendingBaseValuationBucketInterface[]): number {
        return buckets.reduce((total, bucket) => total + bucket.entryCount, 0);
    }

    private createInitialSnapshot(): MoneyDataUpgradeRuntimeSnapshotInterface {
        return {
            isRunning: false,
            isUpdatingBalances: false,
            pendingEntryCount: 0,
            processedEntryCount: 0,
            totalEntryCount: 0,
            lastError: null
        };
    }

    private publishSnapshot(
        snapshot: MoneyDataUpgradeRuntimeSnapshotInterface,
        onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
    ): void {
        this.snapshot = snapshot;
        onProgress?.(snapshot);
    }
}

export const moneyDataUpgradeService = new MoneyDataUpgradeService();
