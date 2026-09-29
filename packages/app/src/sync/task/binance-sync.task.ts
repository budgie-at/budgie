import * as TaskManager from 'expo-task-manager';

import { Workload } from '../../@generic/service/workload.service';
import { BINANCE_SYNC_TASK } from '../constant/binance-sync-task.constant';
import { binanceSyncService } from '../service/binance-sync.service';
import { runBackgroundTask } from '../utils/run-background-task.util';

const BACKGROUND_RUN_BUDGET_MS = 25 * 1000;

TaskManager.defineTask(BINANCE_SYNC_TASK, () =>
    runBackgroundTask(Workload.use(workload => workload.run(binanceSyncService.sync(Date.now() + BACKGROUND_RUN_BUDGET_MS))))
);
