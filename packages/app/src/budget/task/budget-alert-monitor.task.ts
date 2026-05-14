import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { BUDGET_ALERT_MONITOR_TASK } from '../constant/budget-alert-monitor-task.constant';
import { budgetAlertMonitorService } from '../service/budget-alert-monitor.service';

TaskManager.defineTask(BUDGET_ALERT_MONITOR_TASK, async () => {
    try {
        await budgetAlertMonitorService.run();
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    return BackgroundTask.BackgroundTaskResult.Success;
});
