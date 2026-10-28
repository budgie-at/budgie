import { BudgetPeriodCloseService } from '@budgie/budget';
import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { runBackgroundTask } from '../../@generic/utils/run-background-task.util';
import { BudgetBackgroundTaskNameEnum } from '../enum/budget-background-task-name.enum';
import { BudgetAlertMonitorService } from '../service/budget-alert-monitor.service';

TaskManager.defineTask(BudgetBackgroundTaskNameEnum.ALERT_MONITOR, () =>
    runBackgroundTask(
        Effect.gen(function* () {
            const budgetPeriodCloseService = yield* BudgetPeriodCloseService;
            const budgetAlertMonitorService = yield* BudgetAlertMonitorService;

            yield* logAndContinue(budgetPeriodCloseService.closeDuePeriods(new Date()));
            yield* budgetAlertMonitorService.run();

            return BackgroundTask.BackgroundTaskResult.Success;
        })
    )
);
