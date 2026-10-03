import { TransferConsolidationService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { Workload } from '../../@generic/service/workload.service';
import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';
import { runBackgroundTask } from '../utils/run-background-task.util';

TaskManager.defineTask(TRANSFER_CONSOLIDATION_TASK, () =>
    runBackgroundTask(
        Effect.gen(function* () {
            const workload = yield* Workload;
            const transferConsolidationService = yield* TransferConsolidationService;
            yield* workload.run(transferConsolidationService.consolidate(null));

            return BackgroundTask.BackgroundTaskResult.Success;
        })
    )
);
