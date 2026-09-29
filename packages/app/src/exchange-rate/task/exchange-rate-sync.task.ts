import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { Workload } from '../../@generic/service/workload.service';
import { runBackgroundTask } from '../../sync/utils/run-background-task.util';
import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { exchangeRatesSyncService } from '../service/exchange-rates-sync.service';

TaskManager.defineTask(EXCHANGE_RATE_SYNC_TASK, () =>
    runBackgroundTask(
        Effect.as(
            Workload.use(workload => workload.run(exchangeRatesSyncService.sync())),
            BackgroundTask.BackgroundTaskResult.Success
        )
    )
);
