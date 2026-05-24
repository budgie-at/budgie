import { Log } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { THIRTY_MINUTES_IN_SECONDS } from '../constant/time.constant';
import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';

import { transferConsolidationAutoCandidateService } from './transfer-consolidation-auto-candidate.service';
import { transferConsolidationCandidateService } from './transfer-consolidation-candidate.service';

import type { ConsolidationCandidateGroupsInterface } from '../interface/consolidation-candidate-groups.interface';
import type { ConsolidationPreviewInterface } from '../interface/consolidation-preview.interface';
import type { ConsolidationResultInterface } from '../interface/consolidation-result.interface';

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
        result => `done found=${result.found} consolidated=${result.consolidated}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    private async runConsolidation(): Promise<ConsolidationResultInterface> {
        const candidates = await transferConsolidationCandidateService.findGroups();
        const consolidated = await transferConsolidationAutoCandidateService.processGroups(candidates);

        if (isPositiveNumber(consolidated)) {
            await accountBalanceIncrementalService.updateAllBalances(true);
        }

        const result = {
            found: this.countAutoCandidates(candidates),
            consolidated
        };

        return result;
    }

    private async buildPreview(): Promise<ConsolidationPreviewInterface> {
        const candidates = await transferConsolidationCandidateService.findGroups();

        return {
            autoCandidateCount: this.countAutoCandidates(candidates),
            manualReviewCandidateCount:
                candidates.manualReviewCandidates.length +
                candidates.atmCashWithdrawalReviewCandidates.length +
                candidates.refundReviewCandidates.length
        };
    }

    private async runConsolidationIfIdle(): Promise<ConsolidationResultInterface> {
        if (this.isRunning) {
            return { found: 0, consolidated: 0 };
        }

        this.isRunning = true;

        try {
            return await this.runConsolidation();
        } finally {
            this.isRunning = false;
        }
    }

    private async runExclusive<T>(work: () => Promise<T>): Promise<T> {
        const { activeOperation } = this;
        if (isDefined(activeOperation)) {
            await activeOperation;

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

    private countAutoCandidates(candidates: ConsolidationCandidateGroupsInterface): number {
        return (
            candidates.pairCandidates.length +
            candidates.ibanBridgeChainTransferCandidates.length +
            candidates.existingTransferBridgeCandidates.length +
            candidates.ibanBridgeCanonicalDuplicateCandidates.length +
            candidates.existingTransferIncomeDuplicateCandidates.length +
            candidates.ibanBridgeTransferCandidates.length +
            candidates.atmCashWithdrawalCandidates.length +
            candidates.refundCandidates.length
        );
    }
}

export const transferConsolidationService = new TransferConsolidationService();
