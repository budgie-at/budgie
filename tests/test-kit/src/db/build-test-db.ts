import { DatabaseMigrationService } from '@app/@generic/drizzle/service/database-migration.service';
import { Db } from '@budgie/contracts';
import * as SqliteClient from '@effect/sql-sqlite-node/SqliteClient';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as Reactivity from 'effect/reactivity/Reactivity';

import { makeTestDatabase } from './make-test-database';
import { snapshotTestDb } from './reset-test-db';
import { acquireTestDatabasePath } from './test-database-file';

export const makeTestDbLayer = (sourceDatabasePath: string | null) =>
    Layer.effect(
        Db,
        Effect.gen(function* () {
            const path = yield* acquireTestDatabasePath(sourceDatabasePath);
            const client = yield* SqliteClient.make({ filename: path, prepareCacheSize: 0 });

            yield* client.unsafe('PRAGMA foreign_keys = ON');

            const database = yield* makeTestDatabase(client);
            const migrationService = yield* DatabaseMigrationService.make;

            yield* migrationService.migrate().pipe(Effect.provideService(Db, database));
            yield* snapshotTestDb(client);

            return database;
        }).pipe(Effect.orDie)
    ).pipe(Layer.provide(Reactivity.layer));

export const buildTestDb = (sourceDatabasePath: string | null = null) =>
    ManagedRuntime.make(makeTestDbLayer(sourceDatabasePath)).runPromise(Db);
