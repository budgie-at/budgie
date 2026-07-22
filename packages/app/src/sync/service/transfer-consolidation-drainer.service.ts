import { consolidationScopeService } from '@budgie/consolidation';
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isError } from '@rnw-community/shared';

import { scheduleIdleCallback } from '../../@generic/utils/schedule-idle-callback.util';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';

import { syncWorkloadService } from './sync-workload.service';
import { transferConsolidationService } from './transfer-consolidation.service';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

class TransferConsolidationDrainerService {
    private static readonly DEFAULT_DRAIN_DELAY_MS = 3 * 500;
    private static readonly DRAIN_DELAY_MS_BY_REASON: Record<TransferConsolidationDrainReasonEnum, number> = {
        [TransferConsolidationDrainReasonEnum.FILE_IMPORT]: TransferConsolidationDrainerService.DEFAULT_DRAIN_DELAY_MS,
        [TransferConsolidationDrainReasonEnum.MONOBANK_SYNC]: TransferConsolidationDrainerService.DEFAULT_DRAIN_DELAY_MS
    };

    private static readonly FOLLOW_UP_DRAIN_DELAY_MS = TransferConsolidationDrainerService.DEFAULT_DRAIN_DELAY_MS;

    private hasPendingRun = false;
    private pendingScope: ConsolidationScanScopeInterface | null = null;
    private isRunning = false;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private cancelIdleCallback: (() => void) | null = null;

    @Log.withoutErrorPayload(
        (reason, scope) => `enter reason=${reason} scopeIdCount=${scope?.transactionIds.length ?? 0}`,
        (_result, reason, scope) => `done reason=${reason} scopeIdCount=${scope?.transactionIds.length ?? 0}`,
        (error, reason, scope) =>
            `throw reason=${reason} scopeIdCount=${scope?.transactionIds.length ?? 0} errorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    enqueue(reason: TransferConsolidationDrainReasonEnum, scope: ConsolidationScanScopeInterface | null = null): void {
        this.addPendingScope(scope);
        this.hasPendingRun = true;

        if (this.isRunning) {
            return;
        }

        if (isDefined(this.timer) || isDefined(this.cancelIdleCallback)) {
            return;
        }

        this.scheduleAfter(TransferConsolidationDrainerService.DRAIN_DELAY_MS_BY_REASON[reason]);
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    cancelPending(): void {
        this.hasPendingRun = false;
        this.pendingScope = null;
        this.cancelScheduledRun();
    }

    @Log.withoutErrorPayload('enter', 'done', error => `throw errorClass=${isError(error) ? error.name : 'UnknownError'}`)
    private async run(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        if (!this.hasPendingRun) {
            return;
        }

        this.isRunning = true;

        try {
            await this.drainPendingRun();
        } finally {
            this.isRunning = false;
            this.schedulePendingFollowUpRun();
        }
    }

    private async drainPendingRun(): Promise<void> {
        const scope = this.pendingScope;
        this.hasPendingRun = false;
        this.pendingScope = null;

        await syncWorkloadService.run('transfer-consolidation-drain', () => transferConsolidationService.consolidate(scope));
    }

    private addPendingScope(scope: ConsolidationScanScopeInterface | null): void {
        if (!this.hasPendingRun) {
            this.pendingScope = scope;

            return;
        }

        if (!isDefined(scope)) {
            this.pendingScope = null;

            return;
        }

        if (!isDefined(this.pendingScope)) {
            return;
        }

        this.pendingScope = consolidationScopeService.merge(this.pendingScope, scope);
    }

    private schedulePendingFollowUpRun(): void {
        if (!this.hasPendingRun) {
            return;
        }

        this.scheduleAfter(TransferConsolidationDrainerService.FOLLOW_UP_DRAIN_DELAY_MS);
    }

    private scheduleAfter(delay: number): void {
        this.cancelScheduledRun();

        this.timer = setTimeout(() => {
            this.timer = null;
            this.cancelIdleCallback = scheduleIdleCallback(() => {
                this.cancelIdleCallback = null;
                this.run().catch(emptyFn);
            });
        }, delay);
    }

    private cancelScheduledRun(): void {
        if (isDefined(this.timer)) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        if (isDefined(this.cancelIdleCallback)) {
            this.cancelIdleCallback();
            this.cancelIdleCallback = null;
        }
    }
}

export const transferConsolidationDrainerService = new TransferConsolidationDrainerService();
