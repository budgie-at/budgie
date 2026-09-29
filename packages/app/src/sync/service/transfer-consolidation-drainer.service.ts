import { consolidationScopeService } from '@budgie/consolidation';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { Workload } from '../../@generic/service/workload.service';
import { scheduleIdleCallback } from '../../@generic/utils/schedule-idle-callback.util';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';

import { transferConsolidationService } from './transfer-consolidation.service';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

class TransferConsolidationDrainerService {
    private static readonly SCHEDULE_KEY = 'transfer-consolidation-drain';
    private static readonly DRAIN_DELAY = Duration.seconds(1.5);
    private static readonly DRAIN_DELAY_BY_REASON: Record<TransferConsolidationDrainReasonEnum, Duration.Input> = {
        [TransferConsolidationDrainReasonEnum.MONOBANK_SYNC]: TransferConsolidationDrainerService.DRAIN_DELAY,
        [TransferConsolidationDrainReasonEnum.BINANCE_SYNC]: TransferConsolidationDrainerService.DRAIN_DELAY,
        [TransferConsolidationDrainReasonEnum.FILE_IMPORT]: TransferConsolidationDrainerService.DRAIN_DELAY
    };

    private static readonly awaitIdleCallback = Effect.callback(resume => {
        const cancelIdleCallback = scheduleIdleCallback(() => {
            resume(Effect.void);
        });

        return Effect.sync(cancelIdleCallback);
    });

    readonly enqueue = Effect.fn('TransferConsolidationDrainerService.enqueue')(function* (
        this: TransferConsolidationDrainerService,
        reason: TransferConsolidationDrainReasonEnum,
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        this.addPendingScope(scope);
        this.hasPendingRun = true;
        const workload = yield* Workload;
        yield* workload.schedule(
            TransferConsolidationDrainerService.SCHEDULE_KEY,
            this.drain(TransferConsolidationDrainerService.DRAIN_DELAY_BY_REASON[reason])
        );
    });

    readonly cancelPending = Effect.fn('TransferConsolidationDrainerService.cancelPending')(
        function* (this: TransferConsolidationDrainerService) {
            this.takePendingScope();
            const workload = yield* Workload;
            yield* workload.cancelScheduled(TransferConsolidationDrainerService.SCHEDULE_KEY);
        }
    );

    private readonly drain = Effect.fn('TransferConsolidationDrainerService.drain')(function* (
        this: TransferConsolidationDrainerService,
        firstDelay: Duration.Input
    ) {
        const workload = yield* Workload;
        let delay = firstDelay;

        while (this.hasPendingRun) {
            yield* Effect.sleep(delay);
            yield* workload.awaitForegroundIdle;
            yield* TransferConsolidationDrainerService.awaitIdleCallback;
            const scope = this.takePendingScope();
            yield* Effect.yieldNow;
            yield* Effect.exit(workload.run(transferConsolidationService.consolidate(scope)));
            yield* Effect.yieldNow;
            delay = TransferConsolidationDrainerService.DRAIN_DELAY;
        }
    });

    private hasPendingRun = false;
    private pendingScope: ConsolidationScanScopeInterface | null = null;

    private takePendingScope(): ConsolidationScanScopeInterface | null {
        const scope = this.pendingScope;
        this.hasPendingRun = false;
        this.pendingScope = null;

        return scope;
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
}

export const transferConsolidationDrainerService = new TransferConsolidationDrainerService();
