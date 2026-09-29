import * as TaskManager from 'expo-task-manager';

import { Workload } from '../../@generic/service/workload.service';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { monobankSyncService } from '../service/monobank-sync.service';
import { runBackgroundTask } from '../utils/run-background-task.util';

TaskManager.defineTask(MONOBANK_SYNC_TASK, () => runBackgroundTask(Workload.use(workload => workload.run(monobankSyncService.sync()))));
