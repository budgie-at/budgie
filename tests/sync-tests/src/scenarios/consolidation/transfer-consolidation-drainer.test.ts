import { TransferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import { advanceScheduledDrain, TestClockLayer } from '../../harness';

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

const spyOnEmptyConsolidate = Effect.fnUntraced(function* () {
    const transferConsolidationService = yield* TransferConsolidationService;

    return vi.spyOn(transferConsolidationService, 'consolidate').mockReturnValue(Effect.succeed(emptyConsolidationResult));
});

describe('consolidation/transfer-consolidation-drainer', () => {
    it.effect('coalesces queued scopes into one scheduled drain', () =>
        Effect.gen(function* () {
            const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
            const consolidate = yield* spyOnEmptyConsolidate();
            const firstScope = buildScope(1, new Date('2026-01-02T00:00:00.000Z'), new Date('2026-01-03T00:00:00.000Z'));
            const secondScope = buildScope(2, new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-04T00:00:00.000Z'));

            yield* transferConsolidationDrainerService.enqueue(firstScope);
            yield* transferConsolidationDrainerService.enqueue(secondScope);

            yield* advanceScheduledDrain(drainDelayMs - 1);
            expect(consolidate).not.toHaveBeenCalled();

            yield* advanceScheduledDrain(1);

            expect(consolidate).toHaveBeenCalledTimes(1);
            expect(consolidate).toHaveBeenCalledWith({
                operatedAtFrom: secondScope.operatedAtFrom,
                operatedAtTo: secondScope.operatedAtTo,
                transactionIds: [1, 2]
            });
        }).pipe(Effect.provide(TestClockLayer))
    );

    it.effect('schedules one delayed follow-up drain for work queued during an active drain', () =>
        Effect.gen(function* () {
            const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
            const transferConsolidationService = yield* TransferConsolidationService;
            const firstDrainGate = yield* Deferred.make<void>();
            const consolidate = vi
                .spyOn(transferConsolidationService, 'consolidate')
                .mockImplementationOnce(() => Effect.as(Deferred.await(firstDrainGate), emptyConsolidationResult))
                .mockReturnValue(Effect.succeed(emptyConsolidationResult));
            const firstScope = buildScope(1, new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-02T00:00:00.000Z'));
            const secondScope = buildScope(2, new Date('2026-01-03T00:00:00.000Z'), new Date('2026-01-04T00:00:00.000Z'));

            yield* transferConsolidationDrainerService.enqueue(firstScope);
            yield* advanceScheduledDrain(drainDelayMs);
            expect(consolidate).toHaveBeenCalledTimes(1);

            yield* transferConsolidationDrainerService.enqueue(secondScope);
            yield* advanceScheduledDrain(drainDelayMs);
            expect(consolidate).toHaveBeenCalledTimes(1);

            yield* Deferred.succeed(firstDrainGate, undefined);
            yield* advanceScheduledDrain(immediateTimerMs);
            expect(consolidate).toHaveBeenCalledTimes(1);

            yield* advanceScheduledDrain(drainDelayMs);
            expect(consolidate).toHaveBeenCalledTimes(2);
            expect(consolidate).toHaveBeenLastCalledWith(secondScope);
        }).pipe(Effect.provide(TestClockLayer))
    );
});
