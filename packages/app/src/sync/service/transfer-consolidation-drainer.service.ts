import { consolidationScopeService } from '@budgie/consolidation';
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { scheduleIdleCallback } from '../../@generic/utils/schedule-idle-callback.util';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';

import { syncWorkloadService } from './sync-workload.service';
import { transferConsolidationService } from './transfer-consolidation.service';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

class TransferConsolidationDrainerService {
    private static readonly FOREGROUND_BUSY_RESCHEDULE_MS = 1000;
    private static readonly DEFAULT_DRAIN_DELAY_MS = TransferConsolidationDrainerService.FOREGROUND_BUSY_RESCHEDULE_MS + 500;

    private static readonly DRAIN_DELAY_MS_BY_REASON: Record<TransferConsolidationDrainReasonEnum, number> = {
        [TransferConsolidationDrainReasonEnum.MONOBANK_SYNC]: TransferConsolidationDrainerService.DEFAULT_DRAIN_DELAY_MS,
        [TransferConsolidationDrainReasonEnum.BINANCE_SYNC]: TransferConsolidationDrainerService.DEFAULT_DRAIN_DELAY_MS,
        [TransferConsolidationDrainReasonEnum.FILE_IMPORT]: TransferConsolidationDrainerService.DEFAULT_DRAIN_DELAY_MS
    };

    private static readonly FOLLOW_UP_DRAIN_DELAY_MS = TransferConsolidationDrainerService.DEFAULT_DRAIN_DELAY_MS;

    private hasPendingRun = false;
    private pendingScope: ConsolidationScanScopeInterface | null = null;
    private isRunning = false;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private timerFiresAt: number | null = null;
    private cancelIdleCallback: (() => void) | null = null;

    @Log(
        (reason, scope) =>
            `enter reason=${reason} scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''}`,
        (_result, reason, scope) =>
            `done reason=${reason} scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''}`,
        (error, reason, scope) =>
            `throw reason=${reason} scopeTransactionIds=${scope?.transactionIds.join(',') ?? ''} scopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} scopeTo=${scope?.operatedAtTo.toISOString() ?? ''} error=${getErrorMessage(error)}`
    )
    enqueue(reason: TransferConsolidationDrainReasonEnum, scope: ConsolidationScanScopeInterface | null = null): void {
        this.addPendingScope(scope);
        this.hasPendingRun = true;

        if (this.isRunning) {
            return;
        }

        const incomingFiresAt = Date.now() + TransferConsolidationDrainerService.DRAIN_DELAY_MS_BY_REASON[reason];

        if (isDefined(this.cancelIdleCallback)) {
            return;
        }

        if (isDefined(this.timer) && isDefined(this.timerFiresAt) && this.timerFiresAt <= incomingFiresAt) {
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

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    private async run(): Promise<void> {
        if (foregroundWorkloadService.isActive()) {
            this.scheduleAfter(TransferConsolidationDrainerService.FOREGROUND_BUSY_RESCHEDULE_MS);

            return;
        }

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
        await microPause();
        await syncWorkloadService.run('transfer-consolidation-drain', () => transferConsolidationService.consolidate(scope));
        await microPause();
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

        this.timerFiresAt = Date.now() + delay;
        this.timer = setTimeout(() => {
            this.timer = null;
            this.timerFiresAt = null;
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

        this.timerFiresAt = null;

        if (isDefined(this.cancelIdleCallback)) {
            this.cancelIdleCallback();
            this.cancelIdleCallback = null;
        }
    }
}

export const transferConsolidationDrainerService = new TransferConsolidationDrainerService();
