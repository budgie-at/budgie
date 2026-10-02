import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { Workload } from '../../@generic/service/workload.service';
import { runBackgroundTask } from '../../sync/utils/run-background-task.util';
import { ACCOUNT_BALANCE_INCREMENTAL_TASK } from '../constant/account-balance-incremental-task.constant';

TaskManager.defineTask(ACCOUNT_BALANCE_INCREMENTAL_TASK, () =>
    runBackgroundTask(
        Effect.as(
            Effect.gen(function* () {
                const workload = yield* Workload;
                const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;

                return yield* workload.run(accountBalanceIncrementalService.updateAllBalances(false));
            }),
            BackgroundTask.BackgroundTaskResult.Success
        )
    )
);
