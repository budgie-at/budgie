import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { BudgetBackgroundTaskNameEnum } from '../enum/budget-background-task-name.enum';
import { budgetAlertMonitorService } from '../service/budget-alert-monitor.service';

TaskManager.defineTask(BudgetBackgroundTaskNameEnum.ALERT_MONITOR, async () => {
    try {
        await budgetAlertMonitorService.run();
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    return BackgroundTask.BackgroundTaskResult.Success;
});
