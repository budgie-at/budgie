import { TransferConsolidationDrainReasonEnum } from '@app/sync/enum/transfer-consolidation-drain-reason.enum';
import { transferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { run } from '../../harness';
import { flushScheduledDrain } from '../../harness/scheduler/flush-scheduled-drain';
import { useFakeDrainTimers } from '../../harness/scheduler/use-fake-drain-timers';

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

const spyOnConsolidate = () => vi.spyOn(transferConsolidationService, 'consolidate');

const mockPendingConsolidate = (): (() => void) => {
    const firstDrainGate = Deferred.makeUnsafe<void>();

    spyOnConsolidate()
        .mockImplementationOnce(() => Effect.as(Deferred.await(firstDrainGate), emptyConsolidationResult))
        .mockReturnValue(Effect.succeed(emptyConsolidationResult));

    return () => {
        Deferred.doneUnsafe(firstDrainGate, Effect.void);
    };
};

const expectNoFollowUpBeforeActiveDrainFinishes = async (resolveFirstDrain: () => void): Promise<void> => {
    await vi.advanceTimersByTimeAsync(drainDelayMs);
    expect(spyOnConsolidate()).toHaveBeenCalledTimes(1);

    resolveFirstDrain();
    await flushImmediateTimers();
    expect(spyOnConsolidate()).toHaveBeenCalledTimes(1);
};

const expectFollowUpDrain = async (scope: ConsolidationScanScopeInterface): Promise<void> => {
    await flushScheduledDrain(drainDelayMs);
    expect(spyOnConsolidate()).toHaveBeenCalledTimes(2);
    expect(spyOnConsolidate()).toHaveBeenLastCalledWith(scope);
};

describe('consolidation/transfer-consolidation-drainer', () => {
    beforeEach(() => {
        useFakeDrainTimers();
        Object.assign(transferConsolidationDrainerService, {
            hasPendingRun: false,
            pendingScope: null
        });
        spyOnConsolidate().mockReturnValue(Effect.succeed(emptyConsolidationResult));
    });

    afterEach(async () => {
        await run(transferConsolidationDrainerService.cancelPending());
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('coalesces queued scopes into one scheduled drain', async () => {
        const firstScope = buildScope(1, new Date('2026-01-02T00:00:00.000Z'), new Date('2026-01-03T00:00:00.000Z'));
        const secondScope = buildScope(2, new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-04T00:00:00.000Z'));

        await run(transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.FILE_IMPORT, firstScope));
        await run(transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.MONOBANK_SYNC, secondScope));

        await vi.advanceTimersByTimeAsync(drainDelayMs - 1);
        expect(spyOnConsolidate()).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        await vi.runOnlyPendingTimersAsync();
        await Promise.resolve();

        expect(spyOnConsolidate()).toHaveBeenCalledTimes(1);
        expect(spyOnConsolidate()).toHaveBeenCalledWith({
            operatedAtFrom: secondScope.operatedAtFrom,
            operatedAtTo: secondScope.operatedAtTo,
            transactionIds: [1, 2]
        });
    });

    it('schedules one delayed follow-up drain for work queued during an active drain', async () => {
        const firstScope = buildScope(1, new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-02T00:00:00.000Z'));
        const secondScope = buildScope(2, new Date('2026-01-03T00:00:00.000Z'), new Date('2026-01-04T00:00:00.000Z'));
        const resolveFirstDrain = mockPendingConsolidate();

        await run(transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.FILE_IMPORT, firstScope));
        await flushScheduledDrain(drainDelayMs);
        expect(spyOnConsolidate()).toHaveBeenCalledTimes(1);

        await run(transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.MONOBANK_SYNC, secondScope));
        await expectNoFollowUpBeforeActiveDrainFinishes(resolveFirstDrain);
        await expectFollowUpDrain(secondScope);
    });
});
