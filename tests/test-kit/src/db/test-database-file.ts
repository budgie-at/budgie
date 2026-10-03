import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

const SIDECAR_SUFFIXES = ['-wal', '-shm', '-journal'];

export const acquireTestDatabasePath = (sourceDatabasePath: string | null) =>
    Effect.acquireRelease(
        Effect.gen(function* () {
            if (!isDefined(sourceDatabasePath)) {
                return { path: ':memory:', temporaryDirectoryPath: null };
            }

            const existingSidecar = SIDECAR_SUFFIXES.find(suffix => existsSync(`${sourceDatabasePath}${suffix}`));

            if (isDefined(existingSidecar)) {
                return yield* Effect.die(
                    new Error(`Source database cannot be migrated while ${sourceDatabasePath}${existingSidecar} exists`)
                );
            }

            const temporaryDirectoryPath = mkdtempSync(join(tmpdir(), `budgie-test-db-${basename(sourceDatabasePath)}-`));
            const path = join(temporaryDirectoryPath, basename(sourceDatabasePath));

            yield* Effect.try(() => copyFileSync(sourceDatabasePath, path)).pipe(
                Effect.tapError(() => Effect.sync(() => rmSync(temporaryDirectoryPath, { recursive: true, force: true }))),
                Effect.orDie
            );

            return { path, temporaryDirectoryPath };
        }),
        ({ temporaryDirectoryPath }) =>
            Effect.sync(() => {
                if (isDefined(temporaryDirectoryPath)) {
                    rmSync(temporaryDirectoryPath, { recursive: true, force: true });
                }
            })
    ).pipe(Effect.map(({ path }) => path));
