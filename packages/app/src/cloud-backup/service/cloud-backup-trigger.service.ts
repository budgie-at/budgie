import { SYNC_IDENTITY_TABLES } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Queue from 'effect/Queue';
import * as Stream from 'effect/Stream';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';

import { DatabaseChangeService } from '../../@generic/drizzle/service/database-change.service';
import { Workload } from '../../@generic/service/workload.service';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { CLOUD_BACKUP_TASK } from '../constant/cloud-backup-task.constant';

import { CloudBackupService } from './cloud-backup.service';

import type { AppStateStatus } from 'react-native';

export class CloudBackupTriggerService extends Context.Service<CloudBackupTriggerService>()('@budgie/app/CloudBackupTriggerService', {
    make: Effect.gen(function* () {
        const cloudBackupService = yield* CloudBackupService;
        const databaseChangeService = yield* DatabaseChangeService;
        const workload = yield* Workload;
        const userDataTableNames = new Set(SYNC_IDENTITY_TABLES.map(table => table.name));
        const backgroundMinimumAge = Duration.toMillis(Duration.hours(6));
        const afterChangeMinimumAge = Duration.toMillis(Duration.hours(1));
        const afterChangeDebounce = Duration.minutes(10);
        const taskMinimumIntervalMinutes = 24 * 60;

        const appStates = Stream.callback<AppStateStatus>(queue =>
            Effect.acquireRelease(
                Effect.sync(() =>
                    AppState.addEventListener('change', state => {
                        Queue.offerUnsafe(queue, state);
                    })
                ),
                subscription =>
                    Effect.sync(() => {
                        subscription.remove();
                    })
            )
        );

        const registerBackgroundTask = Effect.fn('CloudBackupTriggerService.registerBackgroundTask')(function* () {
            if (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(CLOUD_BACKUP_TASK))) {
                return;
            }

            yield* Effect.promise(() =>
                BackgroundTask.registerTaskAsync(CLOUD_BACKUP_TASK, { minimumInterval: taskMinimumIntervalMinutes })
            );
        });

        return {
            start: Effect.fn('CloudBackupTriggerService.start')(function* () {
                yield* logAndContinue(registerBackgroundTask());
                yield* Effect.forkDetach(
                    Stream.runForEach(
                        Stream.filter(appStates, state => state === 'background'),
                        () => logAndContinue(workload.runScheduled(cloudBackupService.backup(backgroundMinimumAge)))
                    )
                );
                yield* Effect.forkDetach(
                    Stream.runForEach(
                        databaseChangeService.changes.pipe(
                            Stream.filter(tableNames => tableNames.some(tableName => userDataTableNames.has(tableName))),
                            Stream.debounce(afterChangeDebounce)
                        ),
                        () => logAndContinue(workload.run(cloudBackupService.backup(afterChangeMinimumAge)))
                    )
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(CloudBackupTriggerService, CloudBackupTriggerService.make).pipe(
        Layer.provide([CloudBackupService.layer, DatabaseChangeService.layer, Workload.layer])
    );
}
