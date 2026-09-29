import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { runBackgroundTask } from '../../sync/utils/run-background-task.util';
import { BudgetBackgroundTaskNameEnum } from '../enum/budget-background-task-name.enum';
import { budgetAlertMonitorService } from '../service/budget-alert-monitor.service';

TaskManager.defineTask(BudgetBackgroundTaskNameEnum.ALERT_MONITOR, () =>
    runBackgroundTask(Effect.as(budgetAlertMonitorService.run(), BackgroundTask.BackgroundTaskResult.Success))
);
