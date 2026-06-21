import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { TransferConsolidationDrainReasonEnum } from '@app/sync/enum/transfer-consolidation-drain-reason.enum';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

vi.unmock('@app/sync/service/transfer-consolidation-drainer.service');

const drainDelayMs = 1500;
const immediateTimerMs = 0;
const emptyConsolidationResult = { consolidated: 0, found: 0 };

const buildScope = (transactionId: number, operatedAtFrom: Date, operatedAtTo: Date): ConsolidationScanScopeInterface => ({
    operatedAtFrom,
    operatedAtTo,
    transactionIds: [transactionId]
});

const flushImmediateTimers = async (): Promise<void> => {
    await vi.advanceTimersByTimeAsync(immediateTimerMs);
    await Promise.resolve();
};

const flushScheduledDrain = async (): Promise<void> => {
    await vi.advanceTimersByTimeAsync(drainDelayMs);
    await vi.runOnlyPendingTimersAsync();
    await Promise.resolve();
};

describe('consolidation/transfer-consolidation-drainer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('requestIdleCallback', null);
        vi.stubGlobal('cancelIdleCallback', null);
        Object.assign(syncWorkloadService, {
            backgroundQueue: [],
            isAcceptingWork: true,
            isRunning: false,
            queuedUserWorkListeners: new Set(),
            userQueue: []
        });
        Object.assign(transferConsolidationDrainerService, {
            cancelIdleCallback: null,
            hasPendingRun: false,
            isRunning: false,
            pendingScope: null,
            timer: null,
            timerFiresAt: null
        });
        vi.spyOn(transferConsolidationService, 'consolidate').mockResolvedValue(emptyConsolidationResult);
    });

    afterEach(() => {
        transferConsolidationDrainerService.cancelPending();
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('coalesces queued scopes into one scheduled drain', async () => {
        const firstScope = buildScope(1, new Date('2026-01-02T00:00:00.000Z'), new Date('2026-01-03T00:00:00.000Z'));
        const secondScope = buildScope(2, new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-04T00:00:00.000Z'));

        transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.FILE_IMPORT, firstScope);
        transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.MONOBANK_SYNC, secondScope);

        await vi.advanceTimersByTimeAsync(drainDelayMs - 1);
        expect(transferConsolidationService.consolidate).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        await vi.runOnlyPendingTimersAsync();
        await Promise.resolve();

        expect(transferConsolidationService.consolidate).toHaveBeenCalledTimes(1);
        expect(transferConsolidationService.consolidate).toHaveBeenCalledWith({
            operatedAtFrom: secondScope.operatedAtFrom,
            operatedAtTo: secondScope.operatedAtTo,
            transactionIds: [1, 2]
        });
    });

    it('schedules one delayed follow-up drain for work queued during an active drain', async () => {
        const firstScope = buildScope(1, new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-02T00:00:00.000Z'));
        const secondScope = buildScope(2, new Date('2026-01-03T00:00:00.000Z'), new Date('2026-01-04T00:00:00.000Z'));
        let resolveFirstDrain: () => void = emptyFn;

        vi.mocked(transferConsolidationService.consolidate)
            .mockImplementationOnce(
                () =>
                    new Promise(resolve => {
                        resolveFirstDrain = () => {
                            resolve(emptyConsolidationResult);
                        };
                    })
            )
            .mockResolvedValue(emptyConsolidationResult);

        transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.FILE_IMPORT, firstScope);
        await flushScheduledDrain();
        expect(transferConsolidationService.consolidate).toHaveBeenCalledTimes(1);

        transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.MONOBANK_SYNC, secondScope);
        await vi.advanceTimersByTimeAsync(drainDelayMs);
        expect(transferConsolidationService.consolidate).toHaveBeenCalledTimes(1);

        resolveFirstDrain();
        await flushImmediateTimers();
        expect(transferConsolidationService.consolidate).toHaveBeenCalledTimes(1);

        await flushScheduledDrain();
        expect(transferConsolidationService.consolidate).toHaveBeenCalledTimes(2);
        expect(transferConsolidationService.consolidate).toHaveBeenLastCalledWith(secondScope);
    });
});
