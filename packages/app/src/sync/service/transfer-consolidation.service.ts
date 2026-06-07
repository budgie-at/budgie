import { Log, getLogger } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';

import { consolidationCoordinatorService } from './consolidation-coordinator.service';

import type {
    ConsolidationPreviewInterface,
    ConsolidationProgressSnapshotInterface,
    ConsolidationResultInterface
} from '@budgie/consolidation';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const logger = getLogger('TransferConsolidationService');

class TransferConsolidationService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 30;

    private activeOperation: Promise<unknown> | null = null;
    private isRunning = false;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(TRANSFER_CONSOLIDATION_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(TRANSFER_CONSOLIDATION_TASK, {
            minimumInterval: TransferConsolidationService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
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
        scope =>
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''}`,
        (result, scope) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} found=${result.found} consolidated=${result.consolidated}`,
        (error, scope) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} error=${getErrorMessage(error)}`
    )
    async consolidate(scope: ConsolidationScanScopeInterface | null = null): Promise<ConsolidationResultInterface> {
        return this.runExclusive(() => this.runConsolidationIfIdle(scope));
    }

    @Log(
        'enter',
        result =>
            `done autoCandidateCount=${result.autoCandidateCount} manualReviewCandidateCount=${result.manualReviewCandidateCount} remainingCandidateGroupCount=${result.remainingCandidateGroupCount} isRunning=${String(result.isRunning)}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async getProgressSnapshot(): Promise<ConsolidationProgressSnapshotInterface> {
        return this.runExclusive(() => this.buildProgressSnapshot());
    }

    @Log(
        (scope, onProgress) =>
            `enter scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} hasOnProgress=${String(isDefined(onProgress))}`,
        (result, scope, onProgress) =>
            `done scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} hasOnProgress=${String(isDefined(onProgress))} found=${result.found} consolidated=${result.consolidated}`,
        (error, scope, onProgress) =>
            `throw scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} hasOnProgress=${String(isDefined(onProgress))} error=${getErrorMessage(error)}`
    )
    private async runConsolidation(
        scope: ConsolidationScanScopeInterface | null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        const startedAt = Date.now();
        const result = await consolidationCoordinatorService.consolidate(scope, onProgress);

        await this.updateBalancesAfterConsolidation(result.consolidated);

        logger.log('consolidate:duration', {
            durationMs: Date.now() - startedAt,
            found: result.found,
            consolidated: result.consolidated,
            scopeTransactionIds: scope?.transactionIds ?? []
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

    private async buildProgressSnapshot(): Promise<ConsolidationProgressSnapshotInterface> {
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
        scope: ConsolidationScanScopeInterface | null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        if (this.isRunning) {
            return { found: 0, consolidated: 0 };
        }

        this.isRunning = true;

        try {
            return await this.runConsolidation(scope, onProgress);
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
