import { SYNC_IDENTITY_TABLES, logAndContinue } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';

import { appStateChanges } from '../../@generic/constant/app-state-changes.constant';
import { DatabaseChangeService } from '../../@generic/drizzle/service/database-change.service';
import { Workload } from '../../@generic/service/workload.service';

import { CloudBackupService } from './cloud-backup.service';

export class CloudBackupTriggerService extends Context.Service<CloudBackupTriggerService>()('@budgie/app/CloudBackupTriggerService', {
    make: Effect.gen(function* () {
        const cloudBackupService = yield* CloudBackupService;
        const databaseChangeService = yield* DatabaseChangeService;
        const workload = yield* Workload;
        const userDataTableNames = new Set(SYNC_IDENTITY_TABLES.map(table => table.name));
        const backgroundMinimumAge = Duration.toMillis(Duration.hours(6));
        const afterChangeMinimumAge = Duration.toMillis(Duration.hours(1));
        const afterChangeDebounce = Duration.minutes(10);

        return {
            start: Effect.fn('CloudBackupTriggerService.start')(function* () {
                yield* Effect.forkDetach(
                    Stream.runForEach(
                        Stream.filter(appStateChanges, state => state === 'background'),
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
