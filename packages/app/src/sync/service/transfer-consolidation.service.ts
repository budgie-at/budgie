import { Log, getLogger } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { THIRTY_MINUTES_IN_SECONDS } from '../constant/time.constant';
import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';

import { consolidationCoordinatorService } from './consolidation-coordinator.service';

import type { ConsolidationPreviewInterface } from '../interface/consolidation-preview.interface';
import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';
import type { TransferConsolidationProgressSnapshotInterface } from '../interface/transfer-consolidation-progress-snapshot.interface';

const logger = getLogger('TransferConsolidationService');

class TransferConsolidationService {
    private activeOperation: Promise<unknown> | null = null;
    private isRunning = false;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(TRANSFER_CONSOLIDATION_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(TRANSFER_CONSOLIDATION_TASK, {
            minimumInterval: THIRTY_MINUTES_IN_SECONDS
        });
    }

    @Log(
        'enter',
        result => `done autoCandidateCount=${result.autoCandidateCount} manualReviewCandidateCount=${result.manualReviewCandidateCount}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async preview(): Promise<ConsolidationPreviewInterface> {
        return this.runExclusive(() => this.buildPreview());
    }

    @Log(
        'enter',
        result => `done found=${result.found} consolidated=${result.consolidated}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async consolidate(): Promise<ConsolidationResultInterface> {
        return this.runExclusive(() => this.runConsolidationIfIdle());
    }

    @Log(
        'enter',
        result =>
            `done autoCandidateCount=${result.autoCandidateCount} manualReviewCandidateCount=${result.manualReviewCandidateCount} remainingCandidateGroupCount=${result.remainingCandidateGroupCount} isRunning=${String(result.isRunning)}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getProgressSnapshot(): Promise<TransferConsolidationProgressSnapshotInterface> {
        return this.runExclusive(() => this.buildProgressSnapshot());
    }

    @Log(
        onProgress => `enter hasOnProgress=${String(isDefined(onProgress))}`,
        (result, onProgress) =>
            `done hasOnProgress=${String(isDefined(onProgress))} found=${result.found} consolidated=${result.consolidated}`,
        (error, onProgress) => `throw hasOnProgress=${String(isDefined(onProgress))} error=${getErrorMessage(error)}`
    )
    private async runConsolidation(onProgress?: (processedCandidateGroupCount: number) => void): Promise<ConsolidationResultInterface> {
        const startedAt = Date.now();
        const result = await consolidationCoordinatorService.consolidate(onProgress);

        await this.updateBalancesAfterConsolidation(result.consolidated);

        logger.log('consolidate:duration', {
            durationMs: Date.now() - startedAt,
            found: result.found,
            consolidated: result.consolidated
        });

        return result;
    }

    private async updateBalancesAfterConsolidation(consolidated: number): Promise<void> {
        if (!isPositiveNumber(consolidated)) {
            return;
        }

        const startedAt = Date.now();
        await accountBalanceIncrementalService.updateAllBalances(true);
        logger.log('balanceUpdate:duration', { durationMs: Date.now() - startedAt });
    }

    private async buildPreview(): Promise<ConsolidationPreviewInterface> {
        const startedAt = Date.now();
        const autoCandidateCount = await consolidationCoordinatorService.countAutoCandidates();
        const manualReviewCandidateCount = await consolidationCoordinatorService.countManualReviewCandidates();
        logger.log('preview:duration', {
            autoCandidateCount,
            durationMs: Date.now() - startedAt,
            manualReviewCandidateCount
        });

        return {
            autoCandidateCount,
            manualReviewCandidateCount
        };
    }

    private async buildProgressSnapshot(): Promise<TransferConsolidationProgressSnapshotInterface> {
        const startedAt = Date.now();
        const autoCandidateCount = await consolidationCoordinatorService.countAutoCandidates();
        const manualReviewCandidateCount = await consolidationCoordinatorService.countManualReviewCandidates();
        const remainingCandidateGroupCount = autoCandidateCount + manualReviewCandidateCount;
        logger.log('progressSnapshot:duration', {
            autoCandidateCount,
            durationMs: Date.now() - startedAt,
            isRunning: this.isRunning,
            manualReviewCandidateCount,
            remainingCandidateGroupCount
        });

        return {
            autoCandidateCount,
            isRunning: this.isRunning,
            manualReviewCandidateCount,
            remainingCandidateGroupCount
        };
    }

    private async runConsolidationIfIdle(
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        if (this.isRunning) {
            return { found: 0, consolidated: 0 };
        }

        this.isRunning = true;

        try {
            return await this.runConsolidation(onProgress);
        } finally {
            this.isRunning = false;
        }
    }

    private async runExclusive<T>(work: () => Promise<T>): Promise<T> {
        const { activeOperation } = this;
        if (isDefined(activeOperation)) {
            await activeOperation.catch(emptyFn);

            return this.runExclusive(work);
        }

        return this.runActiveOperation(work);
    }

    private async runActiveOperation<T>(work: () => Promise<T>): Promise<T> {
        const operation = foregroundWorkloadService.run(work);
        this.activeOperation = operation;

        try {
            return await operation;
        } finally {
            if (this.activeOperation === operation) {
                this.activeOperation = null;
            }
        }
    }
}

export const transferConsolidationService = new TransferConsolidationService();
