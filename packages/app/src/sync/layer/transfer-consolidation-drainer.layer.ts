import { TransferConsolidationDrainerService, TransferConsolidationWorkload } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Workload } from '../../@generic/service/workload.service';
import { waitForIdle } from '../../@generic/utils/wait-for-idle.util';

const transferConsolidationWorkloadLayer = Layer.effect(
    TransferConsolidationWorkload,
    Effect.gen(function* () {
        const workload = yield* Workload;

        return TransferConsolidationWorkload.of({
            run: workload.run,
            schedule: workload.schedule,
            cancelScheduled: workload.cancelScheduled,
            awaitForegroundIdle: workload.awaitForegroundIdle,
            awaitIdle: waitForIdle
        });
    })
).pipe(Layer.provide(Workload.layer));

export const transferConsolidationDrainerLayer = TransferConsolidationDrainerService.layer.pipe(
    Layer.provide(transferConsolidationWorkloadLayer)
);
