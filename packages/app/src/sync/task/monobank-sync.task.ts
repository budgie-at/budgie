import { getLogger } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage } from '@rnw-community/shared';

import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';
import { monobankSyncService } from '../service/monobank-sync.service';
import { syncWorkloadService } from '../service/sync-workload.service';

const logger = getLogger('monobankSyncTask');

TaskManager.defineTask(MONOBANK_SYNC_TASK, async () => {
    logger.log('enter');
    try {
        const result = await syncWorkloadService.run('background-monobank', () => monobankSyncService.sync());
        logger.log('done', { result });

        return result;
    } catch (error) {
        logger.error('throw', { errorMessage: getErrorMessage(error) });

        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});
