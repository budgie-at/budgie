import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { DatabaseMigrationService } from '@app/@generic/drizzle/service/database-migration.service';
import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Reactivity from 'effect/reactivity/Reactivity';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { getInMemoryDatabaseSync, makeInMemoryTestSqliteClient } from './make-in-memory-test-sqlite-client';
import { makeTestDatabase } from './make-test-database';

const BASELINE_SNAPSHOT_FILENAME = 'budgie-test-baseline.sqlite';

let baselineSnapshotCache: Uint8Array | null = null;

const getBaselineSnapshotPath = () => join(tmpdir(), BASELINE_SNAPSHOT_FILENAME);

const readPersistedBaselineSnapshot = (snapshotPath: string) =>
    Effect.try({
        try: () => readFileSync(snapshotPath),
        catch: () => null
    }).pipe(Effect.orElseSucceed(() => null));

const writePersistedBaselineSnapshot = (snapshotPath: string, snapshot: Uint8Array) => {
    const tempPath = `${snapshotPath}.${process.pid}.${Date.now()}.tmp`;

    return Effect.try({
        try: () => {
            mkdirSync(dirname(snapshotPath), { recursive: true });
            writeFileSync(tempPath, snapshot);
            renameSync(tempPath, snapshotPath);
        },
        catch: () => null
    }).pipe(
        Effect.catch(() =>
            Effect.sync(() => {
                rmSync(tempPath, { force: true });
            })
        )
    );
};

export const getBaselineSnapshot: Effect.Effect<Uint8Array> = Effect.gen(function* () {
    if (isDefined(baselineSnapshotCache)) {
        return baselineSnapshotCache;
    }

    const snapshotPath = getBaselineSnapshotPath();
    const persistedSnapshot = yield* readPersistedBaselineSnapshot(snapshotPath);

    if (isDefined(persistedSnapshot) && isPositiveNumber(persistedSnapshot.byteLength)) {
        baselineSnapshotCache = persistedSnapshot;

        return persistedSnapshot;
    }

    const snapshot = yield* Effect.scoped(
        Effect.gen(function* () {
            const client = yield* makeInMemoryTestSqliteClient();
            const database = yield* makeTestDatabase(client);
            const migrationService = yield* DatabaseMigrationService.make;

            yield* migrationService.migrate().pipe(Effect.provideService(Db, database));

            const databaseSync = getInMemoryDatabaseSync(client);

            if (!isDefined(databaseSync)) {
                return yield* Effect.die(new Error('Expected in-memory DatabaseSync instance'));
            }

            return databaseSync.serialize();
        }).pipe(Effect.provide(Reactivity.layer), Effect.orDie)
    );

    yield* writePersistedBaselineSnapshot(snapshotPath, snapshot);
    baselineSnapshotCache = snapshot;

    return snapshot;
});
