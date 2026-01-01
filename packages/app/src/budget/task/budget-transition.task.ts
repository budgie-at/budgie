import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { BUDGET_TRANSITION_TASK } from '../constant/budget-transition-task.constant';
import { budgetService } from '../service/budget.service';

TaskManager.defineTask(BUDGET_TRANSITION_TASK, async () => {
    try {
        await budgetService.checkAndTransitionAllBudgets();
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }

    return BackgroundTask.BackgroundTaskResult.Success;
});

