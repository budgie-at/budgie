import { SyncWorkload } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Workload } from '../../@generic/service/workload.service';
import { RuleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { TransferConsolidationDrainerService } from '../service/transfer-consolidation-drainer.service';

export const syncWorkloadLayer = Layer.effect(
    SyncWorkload,
    Effect.gen(function* () {
        const workload = yield* Workload;
        const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;
        const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;

        return SyncWorkload.of({
            run: workload.run,
            runUser: workload.runUser,
            hasQueuedWork: workload.hasQueuedWork,
            awaitQueuedUserWork: workload.awaitQueuedUserWork,
            enqueueRuleApplication: ruleApplicationDrainerService.enqueueTransactions,
            enqueueTransferConsolidation: transferConsolidationDrainerService.enqueue
        });
    })
).pipe(Layer.provide([Workload.layer, RuleApplicationDrainerService.layer, TransferConsolidationDrainerService.layer]));
