import { SyncWorkload } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { Workload } from '../../@generic/service/workload.service';
import { RuleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { TransferConsolidationDrainerService } from '../service/transfer-consolidation-drainer.service';

const BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 15;

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
            registerBackgroundTask: Effect.fnUntraced(function* (taskName: string) {
                if (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(taskName))) {
                    yield* Effect.promise(() => BackgroundTask.unregisterTaskAsync(taskName));
                }
                yield* Effect.promise(() =>
                    BackgroundTask.registerTaskAsync(taskName, { minimumInterval: BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES })
                );
            }),
            enqueueRuleApplication: ruleApplicationDrainerService.enqueueTransactions,
            enqueueTransferConsolidation: transferConsolidationDrainerService.enqueue
        });
    })
).pipe(Layer.provide([Workload.layer, RuleApplicationDrainerService.layer, TransferConsolidationDrainerService.layer]));
