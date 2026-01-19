import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isDefined } from '@rnw-community/shared';

import { budgetRepository } from '../../@generic/drizzle/db/db';
import { BUDGET_ALERT_CHECK_TASK } from '../constant/budget-alert-check-task.constant';
import { budgetAlertService } from '../service/budget-alert.service';

TaskManager.defineTask(BUDGET_ALERT_CHECK_TASK, async () => {
    try {
        const budget = await budgetRepository.findActive();

        if (isDefined(budget)) {
            await budgetAlertService.checkAllAlerts(budget.id);
        }
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    return BackgroundTask.BackgroundTaskResult.Success;
});
