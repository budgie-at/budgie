import { TransferConsolidationDrainerService, TransferConsolidationWorkload } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Workload } from '../../@generic/service/workload.service';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';
import { InzhurPendingTopUpService } from '../../inzhur/service/inzhur-pending-top-up.service';

const transferConsolidationWorkloadLayer = Layer.effect(
    TransferConsolidationWorkload,
    Effect.gen(function* () {
        const workload = yield* Workload;
        const inzhurPendingTopUpService = yield* InzhurPendingTopUpService;

        return TransferConsolidationWorkload.of({
            run: effect => workload.run(Effect.tap(effect, () => logAndContinue(inzhurPendingTopUpService.remind()))),
            schedule: workload.schedule,
            cancelScheduled: workload.cancelScheduled,
            awaitForegroundIdle: workload.awaitForegroundIdle,
            awaitIdle: waitForIdle
        });
    })
).pipe(Layer.provide([Workload.layer, InzhurPendingTopUpService.layer]));

export const transferConsolidationDrainerLayer = TransferConsolidationDrainerService.layer.pipe(
    Layer.provide(transferConsolidationWorkloadLayer)
);
