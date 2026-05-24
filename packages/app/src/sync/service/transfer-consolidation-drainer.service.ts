/* eslint-disable no-await-in-loop -- Single-flight drainer intentionally serializes consolidation scans */
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { scheduleIdleCallback } from '../../@generic/utils/schedule-idle-callback.util';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';

import { transferConsolidationService } from './transfer-consolidation.service';

class TransferConsolidationDrainerService {
    private static readonly DRAIN_DELAY_MS_BY_REASON: Record<TransferConsolidationDrainReasonEnum, number> = {
        [TransferConsolidationDrainReasonEnum.MONOBANK_SYNC]: 1500
    };

    private static readonly FOREGROUND_BUSY_RESCHEDULE_MS = 1000;

    private hasPendingRun = false;
    private isRunning = false;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private timerFiresAt: number | null = null;

    @Log(reason => `enter reason=${reason}`, 'done', (error, reason) => `throw reason=${reason} error=${getErrorMessage(error)}`)
    enqueue(reason: TransferConsolidationDrainReasonEnum): void {
        this.hasPendingRun = true;

        if (this.isRunning) {
            return;
        }

        const incomingFiresAt = Date.now() + TransferConsolidationDrainerService.DRAIN_DELAY_MS_BY_REASON[reason];

        if (isDefined(this.timer) && isDefined(this.timerFiresAt) && this.timerFiresAt <= incomingFiresAt) {
            return;
        }

        this.scheduleAfter(TransferConsolidationDrainerService.DRAIN_DELAY_MS_BY_REASON[reason]);
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

        this.isRunning = true;

        try {
            while (this.hasPendingRun) {
                this.hasPendingRun = false;
                await transferConsolidationService.consolidate();
            }
        } finally {
            this.isRunning = false;
        }
    }

    private scheduleAfter(delay: number): void {
        if (isDefined(this.timer)) {
            clearTimeout(this.timer);
        }

        this.timerFiresAt = Date.now() + delay;
        this.timer = setTimeout(() => {
            this.timer = null;
            this.timerFiresAt = null;
            scheduleIdleCallback(() => {
                this.run().catch(emptyFn);
            });
        }, delay);
    }
}

export const transferConsolidationDrainerService = new TransferConsolidationDrainerService();
