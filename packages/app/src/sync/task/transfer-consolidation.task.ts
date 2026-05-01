import { getLogger } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { getErrorMessage } from '@rnw-community/shared';

import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';
import { transferConsolidationService } from '../service/transfer-consolidation.service';

const logger = getLogger('transferConsolidationTask');

TaskManager.defineTask(TRANSFER_CONSOLIDATION_TASK, async () => {
    logger.log('enter');
    try {
        const { found, consolidated } = await transferConsolidationService.consolidate();
        logger.log('done', { found, consolidated });

        return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
        logger.error('throw', { errorMessage: getErrorMessage(error) });

        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});
