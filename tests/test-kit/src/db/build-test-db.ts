import { DatabaseMigrationService } from '@app/@generic/drizzle/service/database-migration.service';
import { Db, makeEffectSqliteClientDatabase } from '@budgie/contracts';
import * as SqliteClient from '@effect/sql-sqlite-node/SqliteClient';
import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
import * as Effect from 'effect/Effect';
import { identity } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as Reactivity from 'effect/reactivity/Reactivity';

import { acquireTestDatabasePath } from './test-database-file';

export const makeTestDbLayer = (sourceDatabasePath: string | null) =>
    Layer.effect(
        Db,
        Effect.gen(function* () {
            const path = yield* acquireTestDatabasePath(sourceDatabasePath);
            const client = yield* SqliteClient.make({ filename: path });

            yield* client.unsafe('PRAGMA foreign_keys = ON');

            const primary = yield* makeEffectSqliteClientDatabase(client, { onMutate: () => Effect.void, runQuery: identity });
            const database = withReplicas(primary, [primary]);
            const migrationService = yield* DatabaseMigrationService.make;

            yield* migrationService.migrate().pipe(Effect.provideService(Db, database));

            return database;
        }).pipe(Effect.orDie)
    ).pipe(Layer.provide(Reactivity.layer));

export const buildTestDb = (sourceDatabasePath: string | null = null) => {
    const runtime = ManagedRuntime.make(makeTestDbLayer(sourceDatabasePath));

    return runtime.runPromise(Db).then(database => ({ database, dispose: () => runtime.dispose() }));
};
