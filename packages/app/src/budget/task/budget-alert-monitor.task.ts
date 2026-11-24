import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { runBackgroundTask } from '../../@generic/utils/run-background-task.util';
import { BudgetBackgroundTaskNameEnum } from '../enum/budget-background-task-name.enum';

TaskManager.defineTask(BudgetBackgroundTaskNameEnum.ALERT_MONITOR, () =>
    runBackgroundTask(() =>
        Effect.gen(function* () {
            const [{ BudgetPeriodCloseService }, { logAndContinue }, { BudgetAlertMonitorService }] = yield* Effect.all(
                [
                    Effect.promise(() => import('@budgie/budget')),
                    Effect.promise(() => import('@budgie/contracts')),
                    Effect.promise(() => import('../service/budget-alert-monitor.service'))
                ],
                { concurrency: 'unbounded' }
            );
            const budgetPeriodCloseService = yield* BudgetPeriodCloseService;
            const budgetAlertMonitorService = yield* BudgetAlertMonitorService;

            const now = yield* DateTime.nowAsDate;
            yield* logAndContinue(budgetPeriodCloseService.closeDuePeriods(now));
            yield* budgetAlertMonitorService.run();

            return BackgroundTask.BackgroundTaskResult.Success;
        })
    )
);
