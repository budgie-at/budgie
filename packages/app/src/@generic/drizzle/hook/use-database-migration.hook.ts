import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import * as Schema from 'effect/Schema';

import { appAtomRuntime } from '../../runtime/app.runtime';
import { DatabaseMigrationStatusEnum } from '../enum/database-migration-status.enum';
import { DatabaseOpenError } from '../error/database-open.error';
import { DatabaseMaintenanceService } from '../service/database-maintenance.service';
import { DatabaseMigrationService } from '../service/database-migration.service';

const databaseMigrationAtom = appAtomRuntime
    .atom(
        Effect.gen(function* () {
            const databaseMigrationService = yield* DatabaseMigrationService;

            performance.mark('budgie:runtime-ready');
            yield* databaseMigrationService.migrate();
            performance.mark('budgie:migrations-done');
            yield* (yield* DatabaseMaintenanceService).compact().pipe(Effect.catchCause(Effect.logError));
        })
    )
    .pipe(Atom.keepAlive);

export const useDatabaseMigration = (): DatabaseMigrationStatusEnum =>
    AsyncResult.match(useAtomValue(databaseMigrationAtom), {
        onInitial: () => DatabaseMigrationStatusEnum.MIGRATING,
        onSuccess: () => DatabaseMigrationStatusEnum.MIGRATED,
        onFailure: ({ cause }) =>
            Schema.is(DatabaseOpenError)(Cause.squash(cause)) ? DatabaseMigrationStatusEnum.UNOPENABLE : DatabaseMigrationStatusEnum.FAILED
    });
