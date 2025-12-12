import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { ACCOUNT_BALANCE_INCREMENTAL_TASK } from '../constant/account-balance-incremental-task.constant';
import { accountBalanceIncrementalService } from '../service/account-balance-incremental.service';

TaskManager.defineTask(ACCOUNT_BALANCE_INCREMENTAL_TASK, async () => {
    try {
        await accountBalanceIncrementalService.updateAllBalances();
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    return BackgroundTask.BackgroundTaskResult.Success;
});
