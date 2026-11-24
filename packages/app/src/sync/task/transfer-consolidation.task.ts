import * as Effect from 'effect/Effect';
import * as TaskManager from 'expo-task-manager';

import { runWorkloadBackgroundTask } from '../../@generic/utils/run-workload-background-task.util';
import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';

TaskManager.defineTask(TRANSFER_CONSOLIDATION_TASK, () =>
    runWorkloadBackgroundTask(workload =>
        Effect.gen(function* () {
            const { TransferConsolidationService } = yield* Effect.promise(() => import('@budgie/ledger'));
            const transferConsolidationService = yield* TransferConsolidationService;

            return yield* workload.run(transferConsolidationService.consolidate(null));
        })
    )
);
