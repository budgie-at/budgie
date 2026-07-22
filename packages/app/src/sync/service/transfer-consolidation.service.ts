import { Log } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { emptyFn, getErrorMessage, isDefined, isError, isPositiveNumber } from '@rnw-community/shared';

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

    @Log.withoutErrorPayload(void 0, void 0, error => (isError(error) ? error.name : typeof error))
    async preview(): Promise<ConsolidationPreviewInterface> {
        return this.runExclusive(() => this.buildPreview());
    }

    @Log.withoutErrorPayload()
    async consolidate(scope: ConsolidationScanScopeInterface | null = null): Promise<ConsolidationResultInterface> {
        return this.runExclusive(() => this.runConsolidationIfIdle(scope));
    }

    @Log.withoutErrorPayload(void 0, void 0, error => (isError(error) ? error.name : typeof error))
    async getProgressSnapshot(): Promise<ConsolidationProgressSnapshotInterface> {
        return this.runExclusive(() => this.buildProgressSnapshot());
    }

    private async runConsolidation(
        scope: ConsolidationScanScopeInterface | null,
        onProgress?: (processedCandidateGroupCount: number) => void
    ): Promise<ConsolidationResultInterface> {
        const result = await consolidationCoordinatorService.consolidate(scope, onProgress);

        await this.updateBalancesAfterConsolidation(result.consolidated);

        return result;
    }

    private async updateBalancesAfterConsolidation(consolidated: number): Promise<void> {
        if (!isPositiveNumber(consolidated)) {
            return;
        }

        await accountBalanceIncrementalService.updateAllBalances(true);
    }

    private async buildPreview(): Promise<ConsolidationPreviewInterface> {
        const autoCandidateCount = await consolidationCoordinatorService.countAutoCandidates();
        const manualReviewCandidateCount = await consolidationCoordinatorService.countManualReviewCandidates();

        return {
            autoCandidateCount,
            manualReviewCandidateCount
        };
    }

    private async buildProgressSnapshot(): Promise<ConsolidationProgressSnapshotInterface> {
        const autoCandidateCount = await consolidationCoordinatorService.countAutoCandidates();
        const manualReviewCandidateCount = await consolidationCoordinatorService.countManualReviewCandidates();
        const remainingCandidateGroupCount = autoCandidateCount + manualReviewCandidateCount;

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
