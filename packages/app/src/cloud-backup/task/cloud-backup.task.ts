import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { runBackgroundTask } from '../../@generic/utils/run-background-task.util';
import { CLOUD_BACKUP_TASK } from '../constant/cloud-backup-task.constant';

TaskManager.defineTask(CLOUD_BACKUP_TASK, () =>
    runBackgroundTask(() =>
        Effect.gen(function* () {
            const [{ Workload }, { CloudBackupService }] = yield* Effect.all(
                [
                    Effect.promise(() => import('../../@generic/service/workload.service')),
                    Effect.promise(() => import('../service/cloud-backup.service'))
                ],
                { concurrency: 'unbounded' }
            );
            const workload = yield* Workload;
            const cloudBackupService = yield* Effect.serviceOption(CloudBackupService);

            if (Option.isSome(cloudBackupService)) {
                yield* workload.run(cloudBackupService.value.backup(0));
            }

            return BackgroundTask.BackgroundTaskResult.Success;
        })
    )
);
