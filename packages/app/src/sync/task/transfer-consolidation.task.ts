import { ExternalSourceEnum } from '@budgie/contracts';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';
import { transferConsolidationService } from '../service/transfer-consolidation.service';

TaskManager.defineTask(TRANSFER_CONSOLIDATION_TASK, async () => {
    try {
        return await transferConsolidationService.consolidate(ExternalSourceEnum.MONOBANK);
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});
