import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { t } from '@lingui/core/macro';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { db, transactionEntryRepository } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

import { entryBaseValuationService } from './entry-base-valuation.service';

import type { MoneyDataUpgradeRuntimeSnapshotInterface } from '../interface/money-data-upgrade-runtime-snapshot.interface';
import type { DB, PendingBaseValuationBucketInterface } from '@budgie/contracts';

class MoneyDataUpgradeService {
    private static readonly BUCKET_BATCH_SIZE = 25;

    private snapshot: MoneyDataUpgradeRuntimeSnapshotInterface = this.createInitialSnapshot();

    @Log(
        'enter',
        result =>
            `done isRunning=${String(result.isRunning)} pendingEntryCount=${result.pendingEntryCount} lastError=${result.lastError ?? ''}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getSnapshot(): Promise<MoneyDataUpgradeRuntimeSnapshotInterface> {
        if (this.snapshot.isRunning) {
            return this.snapshot;
        }

        const baseInstrument = await exchangeRatesService.getBaseInstrument();
        if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
            return {
                ...this.createInitialSnapshot(),
                lastError: t`Base instrument not found`
            };
        }

        const pendingEntryCount = await transactionEntryRepository.countPendingBaseValuationEntries(baseInstrument.id);

        return {
            ...this.createInitialSnapshot(),
            pendingEntryCount,
            totalEntryCount: pendingEntryCount
        };
    }

    @Log(
        onProgress => `enter hasOnProgress=${String(isDefined(onProgress))}`,
        (result, onProgress) =>
            `done processedEntryCount=${result.processedEntryCount} totalEntryCount=${result.totalEntryCount} hasOnProgress=${String(isDefined(onProgress))}`,
        (error, onProgress) => `throw hasOnProgress=${String(isDefined(onProgress))} error=${getErrorMessage(error)}`
    )
    async run(
        onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
    ): Promise<MoneyDataUpgradeRuntimeSnapshotInterface> {
        if (this.snapshot.isRunning) {
            return this.snapshot;
        }

        this.publishSnapshot({ ...this.snapshot, isRunning: true, lastError: null }, onProgress);

        try {
            await this.valuePendingEntries(onProgress);
            this.publishSnapshot({ ...this.snapshot, isRunning: false, isUpdatingBalances: false }, onProgress);

            return this.snapshot;
        } catch (error) {
            this.publishSnapshot(
                { ...this.snapshot, isRunning: false, isUpdatingBalances: false, lastError: getErrorMessage(error) },
                onProgress
            );

            throw error;
        }
    }

    private async valuePendingEntries(onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void): Promise<void> {
        const baseInstrument = await exchangeRatesService.getBaseInstrument();

        if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
            throw new Error(t`Base instrument not found`);
        }

        const buckets = await transactionEntryRepository.findPendingBaseValuationBuckets(baseInstrument.id);
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

        await this.valuePendingEntryBuckets(buckets, baseInstrument.id, onProgress);

        this.publishSnapshot(
            {
                ...this.snapshot,
                isUpdatingBalances: true
            },
            onProgress
        );

        await accountBalanceIncrementalService.updateAllBalances(true);
    }

    private async valuePendingEntryBuckets(
        buckets: PendingBaseValuationBucketInterface[],
        baseInstrumentId: number,
        onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
    ): Promise<void> {
        await this.toBucketBatches(buckets).reduce(
            (previousBatchPromise, batch) =>
                previousBatchPromise.then(() => this.valuePendingEntryBatch(batch, baseInstrumentId, onProgress)),
            Promise.resolve()
        );
    }

    private async valuePendingEntryBatch(
        batch: PendingBaseValuationBucketInterface[],
        baseInstrumentId: number,
        onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
    ): Promise<void> {
        await transactionAsync(db, async tx => {
            await batch.reduce(
                (previousBucketPromise, bucket) =>
                    previousBucketPromise.then(() => this.valuePendingEntryBucket(bucket, baseInstrumentId, tx)),
                Promise.resolve()
            );
        });

        const batchEntryCount = this.sumBucketEntries(batch);
        this.publishSnapshot(
            {
                ...this.snapshot,
                pendingEntryCount: Math.max(this.snapshot.pendingEntryCount - batchEntryCount, 0),
                processedEntryCount: this.snapshot.processedEntryCount + batchEntryCount
            },
            onProgress
        );

        await microPause();
    }

    private async valuePendingEntryBucket(bucket: PendingBaseValuationBucketInterface, baseInstrumentId: number, tx: DB): Promise<void> {
        const operatedAt = new Date(bucket.rateDate);
        operatedAt.setHours(0, 0, 0, 0);

        const baseExchangeRate =
            bucket.sourceInstrumentId === baseInstrumentId
                ? 1
                : await entryBaseValuationService.resolveHistoricalBaseExchangeRateOrNull(
                      bucket.sourceInstrumentId,
                      baseInstrumentId,
                      operatedAt,
                      tx
                  );

        await transactionEntryRepository.updateBaseValuationBucket(
            {
                rateDate: bucket.rateDate,
                sourceInstrumentId: bucket.sourceInstrumentId,
                baseInstrumentId,
                baseExchangeRate
            },
            tx
        );
    }

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
