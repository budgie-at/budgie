import { consolidationScopeService } from '@budgie/consolidation';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { Workload } from '../../@generic/service/workload.service';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';

import { transferConsolidationService } from './transfer-consolidation.service';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

class TransferConsolidationDrainerService {
    private static readonly SCHEDULE_KEY = 'transfer-consolidation-drain';
    private static readonly DRAIN_DELAY = Duration.seconds(1.5);

    readonly enqueue = Effect.fn('TransferConsolidationDrainerService.enqueue')(function* (
        this: TransferConsolidationDrainerService,
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        this.addPendingScope(scope);
        this.hasPendingRun = true;
        const workload = yield* Workload;
        yield* workload.schedule(TransferConsolidationDrainerService.SCHEDULE_KEY, this.drain());
    });

    readonly cancelPending = Effect.fn('TransferConsolidationDrainerService.cancelPending')(
        function* (this: TransferConsolidationDrainerService) {
            this.takePendingScope();
            const workload = yield* Workload;
            yield* workload.cancelScheduled(TransferConsolidationDrainerService.SCHEDULE_KEY);
        }
    );

    private readonly drain = Effect.fn('TransferConsolidationDrainerService.drain')(function* (this: TransferConsolidationDrainerService) {
        const workload = yield* Workload;

        while (this.hasPendingRun) {
            yield* Effect.sleep(TransferConsolidationDrainerService.DRAIN_DELAY);
            yield* workload.awaitForegroundIdle;
            yield* waitForIdle;
            const scope = this.takePendingScope();
            yield* Effect.yieldNow;
            yield* Effect.exit(workload.run(transferConsolidationService.consolidate(scope)));
            yield* Effect.yieldNow;
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
