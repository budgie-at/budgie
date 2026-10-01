import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { appAtomRuntime } from '../../runtime/app.runtime';
import { DatabaseMigrationStatusEnum } from '../enum/database-migration-status.enum';
import { DatabaseOpenError } from '../error/database-open.error';
import { DatabaseMigrationService } from '../service/database-migration.service';

const databaseMigrationAtom = appAtomRuntime
    .atom(Effect.flatMap(DatabaseMigrationService, databaseMigrationService => databaseMigrationService.migrate()))
    .pipe(Atom.keepAlive);

export const useDatabaseMigration = (): DatabaseMigrationStatusEnum =>
    AsyncResult.match(useAtomValue(databaseMigrationAtom), {
        onInitial: () => DatabaseMigrationStatusEnum.MIGRATING,
        onSuccess: () => DatabaseMigrationStatusEnum.MIGRATED,
        onFailure: ({ cause }) =>
            Cause.squash(cause) instanceof DatabaseOpenError ? DatabaseMigrationStatusEnum.UNOPENABLE : DatabaseMigrationStatusEnum.FAILED
    });
