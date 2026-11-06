import { DatabaseMigrationService } from '@app/@generic/drizzle/service/database-migration.service';
import { Db } from '@budgie/contracts';
import * as SqliteClient from '@effect/sql-sqlite-node/SqliteClient';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as Reactivity from 'effect/reactivity/Reactivity';

import { isDefined } from '@rnw-community/shared';

import { makeTestDatabase } from './make-test-database';
import { acquireTestDatabasePath } from './test-database-file';

import type { TestDatabaseHandleInterface } from './interface/test-database-handle.interface';
import type { DB } from '@budgie/contracts';

export const makeTestDbLayer = (sourceDatabasePath: string | null) =>
    Layer.effect(
        Db,
        Effect.gen(function* () {
            const path = yield* acquireTestDatabasePath(sourceDatabasePath);
            const client = yield* SqliteClient.make({ filename: path });

            yield* client.unsafe('PRAGMA foreign_keys = ON');

            const database = yield* makeTestDatabase(client);
            const migrationService = yield* DatabaseMigrationService.make;

            yield* migrationService.migrate().pipe(Effect.provideService(Db, database));

            return database;
        }).pipe(Effect.orDie)
    ).pipe(Layer.provide(Reactivity.layer));

class TestDatabase {
    static readonly initializeAll = Effect.suspend(() =>
        Effect.forEach(TestDatabase.databases.values(), database => database.initialize, { discard: true })
    );

    static readonly disposeAll = Effect.suspend(() =>
        Effect.forEach(TestDatabase.databases.values(), database => database.disposeEffect, { discard: true })
    );

    private static readonly databases = new Map<string | null, TestDatabase>();

    readonly database: DB;

    private isDisposed = false;

    private readonly disposeEffect = Effect.suspend(() => this.runtime.disposeEffect).pipe(
        Effect.andThen(
            Effect.sync(() => {
                this.isDisposed = true;
            })
        )
    );

    private readonly initialize = Effect.gen({ self: this }, function* () {
        if (this.isDisposed) {
            this.runtime = ManagedRuntime.make(makeTestDbLayer(this.sourceDatabasePath));
            this.activeDatabase = yield* Effect.provide(Db, yield* this.runtime.contextEffect);
            this.isDisposed = false;
        }
    });

    private constructor(
        private readonly sourceDatabasePath: string | null,
        private runtime: ManagedRuntime.ManagedRuntime<Db, never>,
        private activeDatabase: DB
    ) {
        this.database = new Proxy(activeDatabase, {
            get: (_target, property): unknown => Reflect.get(this.activeDatabase, property, this.activeDatabase)
        });
    }

    readonly dispose = () => Effect.runPromise(this.disposeEffect);

    static readonly acquire = (sourceDatabasePath: string | null) =>
        Effect.gen(function* () {
            const existing = TestDatabase.databases.get(sourceDatabasePath);
            if (isDefined(existing)) {
                yield* existing.initialize;

                return existing;
            }

            const runtime = ManagedRuntime.make(makeTestDbLayer(sourceDatabasePath));
            const database = new TestDatabase(sourceDatabasePath, runtime, yield* Effect.provide(Db, yield* runtime.contextEffect));
            TestDatabase.databases.set(sourceDatabasePath, database);

            return database;
        });
}

export const initializeTestDatabases = TestDatabase.initializeAll;

export const disposeTestDatabases = TestDatabase.disposeAll;

export const buildTestDb = (sourceDatabasePath: string | null = null): Promise<TestDatabaseHandleInterface> =>
    Effect.runPromise(TestDatabase.acquire(sourceDatabasePath));
