import * as Effect from 'effect/Effect';
import * as TaskManager from 'expo-task-manager';

import { runWorkloadBackgroundTask } from '../../@generic/utils/run-workload-background-task.util';
import { ACCOUNT_BALANCE_INCREMENTAL_TASK } from '../constant/account-balance-incremental-task.constant';

TaskManager.defineTask(ACCOUNT_BALANCE_INCREMENTAL_TASK, () =>
    runWorkloadBackgroundTask(workload =>
        Effect.gen(function* () {
            const { AccountBalanceIncrementalService } = yield* Effect.promise(() => import('@budgie/ledger'));
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;

            return yield* workload.run(accountBalanceIncrementalService.updateAllBalances(false));
        })
    )
);
