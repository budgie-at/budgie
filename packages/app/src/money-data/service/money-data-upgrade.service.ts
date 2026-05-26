import { transactionAsync } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { db, transactionEntryRepository } from '../../@generic/drizzle/db/db';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { transferConsolidationService } from '../../sync/service/transfer-consolidation.service';

import { entryBaseValuationService } from './entry-base-valuation.service';

import type { MoneyDataUpgradeBucketsInputInterface } from '../interface/money-data-upgrade-buckets-input.interface';
import type { MoneyDataUpgradeRuntimeSnapshotInterface } from '../interface/money-data-upgrade-runtime-snapshot.interface';
import type { DB, PendingBaseValuationBucketInterface } from '@budgie/contracts';

class MoneyDataUpgradeService {
    private snapshot: MoneyDataUpgradeRuntimeSnapshotInterface = this.createInitialSnapshot();

    async getSnapshot(): Promise<MoneyDataUpgradeRuntimeSnapshotInterface> {
        if (this.snapshot.isRunning) {
            return this.snapshot;
        }

        const baseInstrument = await exchangeRatesService.getBaseInstrument();
        const consolidationSnapshot = await transferConsolidationService.getProgressSnapshot();

        if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
            return {
                ...this.createInitialSnapshot(),
                consolidationRemainingCount: consolidationSnapshot.autoCandidateCount,
                consolidationTotalCount: consolidationSnapshot.autoCandidateCount,
                lastError: t`Base instrument not found`
            };
        }

        const pendingEntryCount = await transactionEntryRepository.countPendingBaseValuationEntries(baseInstrument.id);

        return {
            ...this.createInitialSnapshot(),
            pendingEntryCount,
            totalEntryCount: pendingEntryCount,
            consolidationRemainingCount: consolidationSnapshot.autoCandidateCount,
            consolidationTotalCount: consolidationSnapshot.autoCandidateCount
        };
    }

    async run(
        onProgress?: (snapshot: MoneyDataUpgradeRuntimeSnapshotInterface) => void
    ): Promise<MoneyDataUpgradeRuntimeSnapshotInterface> {
        if (this.snapshot.isRunning) {
            return this.snapshot;
        }

        this.publishSnapshot({ ...this.snapshot, isRunning: true, lastError: null }, onProgress);

        try {
            await this.valuePendingEntries(onProgress);
            const consolidationSnapshot = await transferConsolidationService.getProgressSnapshot();
            const consolidationTotalCount = consolidationSnapshot.autoCandidateCount;
            const consolidationResult = await transferConsolidationService.runForMoneyDataUpgrade(processedCandidateGroupCount => {
                this.publishSnapshot(
                    {
                        ...this.snapshot,
                        consolidationRemainingCount: Math.max(consolidationTotalCount - processedCandidateGroupCount, 0),
                        consolidationTotalCount
                    },
                    onProgress
                );
            });

            this.publishSnapshot(
                {
                    ...this.snapshot,
                    consolidationRemainingCount: consolidationResult.after.autoCandidateCount,
                    consolidationTotalCount: consolidationResult.before.autoCandidateCount,
                    isRunning: false
                },
                onProgress
            );

            return this.snapshot;
        } catch (error) {
            this.publishSnapshot(
                {
                    ...this.snapshot,
                    isRunning: false,
                    lastError: getErrorMessage(error)
                },
                onProgress
            );

            return this.snapshot;
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

        await transactionAsync(db, async tx => {
            await this.valuePendingEntryBuckets({ buckets, bucketIndex: 0, baseInstrumentId: baseInstrument.id, onProgress }, tx);
        });

        await accountBalanceIncrementalService.updateAllBalances(true);
    }

    private async valuePendingEntryBuckets(input: MoneyDataUpgradeBucketsInputInterface, tx: DB): Promise<void> {
        const bucket = input.buckets[input.bucketIndex];

        if (!isDefined(bucket)) {
            return;
        }

        const operatedAt = new Date(bucket.rateDate);
        operatedAt.setHours(0, 0, 0, 0);

        const baseExchangeRate =
            bucket.sourceInstrumentId === input.baseInstrumentId
                ? 1
                : await entryBaseValuationService.resolveHistoricalBaseExchangeRate(
                      bucket.sourceInstrumentId,
                      input.baseInstrumentId,
                      operatedAt,
                      tx
                  );

        await transactionEntryRepository.updateBaseValuationBucket(
            {
                rateDate: bucket.rateDate,
                sourceInstrumentId: bucket.sourceInstrumentId,
                baseInstrumentId: input.baseInstrumentId,
                baseExchangeRate
            },
            tx
        );

        this.publishSnapshot(
            {
                ...this.snapshot,
                pendingEntryCount: Math.max(this.snapshot.pendingEntryCount - bucket.entryCount, 0),
                processedEntryCount: this.snapshot.processedEntryCount + bucket.entryCount
            },
            input.onProgress
        );

        await this.valuePendingEntryBuckets({ ...input, bucketIndex: input.bucketIndex + 1 }, tx);
    }

    private sumBucketEntries(buckets: PendingBaseValuationBucketInterface[]): number {
        return buckets.reduce((total, bucket) => total + bucket.entryCount, 0);
    }

    private createInitialSnapshot(): MoneyDataUpgradeRuntimeSnapshotInterface {
        return {
            isRunning: false,
            pendingEntryCount: 0,
            processedEntryCount: 0,
            totalEntryCount: 0,
            consolidationRemainingCount: 0,
            consolidationTotalCount: 0,
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
