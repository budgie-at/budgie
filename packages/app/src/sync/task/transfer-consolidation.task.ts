import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';
import { syncWorkloadService } from '../service/sync-workload.service';
import { transferConsolidationService } from '../service/transfer-consolidation.service';

TaskManager.defineTask(TRANSFER_CONSOLIDATION_TASK, async () => {
    try {
        await syncWorkloadService.run('background-transfer-consolidation', () => transferConsolidationService.consolidate());

        return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});
