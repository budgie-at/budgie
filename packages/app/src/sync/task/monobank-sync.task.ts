import * as Effect from 'effect/Effect';
import * as TaskManager from 'expo-task-manager';

import { Workload } from '../../@generic/service/workload.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { MonobankSyncService } from '../service/monobank-sync.service';
import { runBackgroundTask } from '../utils/run-background-task.util';

TaskManager.defineTask(MONOBANK_SYNC_TASK, () =>
    runBackgroundTask(
        Effect.gen(function* () {
            const workload = yield* Workload;
            const monobankSyncService = yield* MonobankSyncService;

            return yield* workload.run(monobankSyncService.sync());
        })
    )
);
