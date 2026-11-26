import { mkdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { DatabaseMigrationService } from '@app/@generic/drizzle/service/database-migration.service';
import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Reactivity from 'effect/reactivity/Reactivity';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { makeInMemoryTestSqliteClient } from './make-in-memory-test-sqlite-client';
import { makeTestDatabase } from './make-test-database';

import type { BaselineSnapshotInterface } from './interface/baseline-snapshot.interface';
import type * as Client from 'effect/sql/SqlClient';

const BASELINE_SNAPSHOT_FILENAME = 'budgie-test-baseline.sqlite';

let baselineSnapshotCache: BaselineSnapshotInterface | null = null;

const supportsInMemoryDeserialize = (): boolean => typeof DatabaseSync.prototype.deserialize === 'function';

const getBaselineSnapshotPath = () => join(tmpdir(), BASELINE_SNAPSHOT_FILENAME);

const readPersistedBuffer = (snapshotPath: string) =>
    Effect.try({
        try: () => readFileSync(snapshotPath),
        catch: () => null
    }).pipe(Effect.orElseSucceed(() => null));

const readPersistedSize = (snapshotPath: string) =>
    Effect.try({
        try: () => statSync(snapshotPath).size,
        catch: () => null
    }).pipe(Effect.orElseSucceed(() => null));

const readPersistedBaselineSnapshot = (snapshotPath: string): Effect.Effect<BaselineSnapshotInterface | null> =>
    Effect.gen(function* () {
        if (supportsInMemoryDeserialize()) {
            const buffer = yield* readPersistedBuffer(snapshotPath);

            if (isDefined(buffer) && isPositiveNumber(buffer.byteLength)) {
                return { path: snapshotPath, buffer };
            }

            return null;
        }

        const size = yield* readPersistedSize(snapshotPath);

        if (isDefined(size) && isPositiveNumber(size)) {
            return { path: snapshotPath, buffer: null };
        }

        return null;
    });

const writeBaselineSnapshotFile = (client: Client.SqlClient, snapshotPath: string) => {
    const tempPath = `${snapshotPath}.${process.pid}.${Date.now()}.tmp`;

    return Effect.try({ try: () => void mkdirSync(dirname(snapshotPath), { recursive: true }), catch: getErrorMessage }).pipe(
        Effect.andThen(client.unsafe(`VACUUM INTO '${tempPath.replaceAll("'", "''")}'`)),
        Effect.andThen(Effect.try({ try: () => void renameSync(tempPath, snapshotPath), catch: getErrorMessage })),
        Effect.catch(cause =>
            Effect.sync(() => {
                rmSync(tempPath, { force: true });
            }).pipe(
                Effect.andThen(readPersistedSize(snapshotPath)),
                Effect.flatMap(size =>
                    isDefined(size) && isPositiveNumber(size) ? Effect.void : Effect.die(new Error(getErrorMessage(cause)))
                )
            )
        )
    );
};

export const getBaselineSnapshot: Effect.Effect<BaselineSnapshotInterface> = Effect.gen(function* () {
    if (isDefined(baselineSnapshotCache)) {
        return baselineSnapshotCache;
    }

    const snapshotPath = getBaselineSnapshotPath();
    const persistedSnapshot = yield* readPersistedBaselineSnapshot(snapshotPath);

    if (isDefined(persistedSnapshot)) {
        baselineSnapshotCache = persistedSnapshot;

        return persistedSnapshot;
    }

    yield* Effect.scoped(
        Effect.gen(function* () {
            const client = yield* makeInMemoryTestSqliteClient();
            const database = yield* makeTestDatabase(client);
            const migrationService = yield* DatabaseMigrationService.make;

            yield* migrationService.migrate().pipe(Effect.provideService(Db, database));

            yield* writeBaselineSnapshotFile(client, snapshotPath);
        }).pipe(Effect.provide(Reactivity.layer), Effect.orDie)
    );

    const writtenSnapshot = yield* readPersistedBaselineSnapshot(snapshotPath);

    if (!isDefined(writtenSnapshot)) {
        return yield* Effect.die(new Error(`Expected baseline snapshot at ${snapshotPath}`));
    }

    baselineSnapshotCache = writtenSnapshot;

    return writtenSnapshot;
});
