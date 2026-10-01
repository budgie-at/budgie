import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

const SIDECAR_SUFFIXES = ['-wal', '-shm', '-journal'];

export const acquireTestDatabasePath = (sourceDatabasePath: string | null) =>
    Effect.acquireRelease(
        Effect.sync(() => {
            if (!isDefined(sourceDatabasePath)) {
                return { path: ':memory:', temporaryDirectoryPath: null };
            }

            SIDECAR_SUFFIXES.forEach(suffix => {
                if (existsSync(`${sourceDatabasePath}${suffix}`)) {
                    throw new Error(`Source database cannot be migrated while ${sourceDatabasePath}${suffix} exists`);
                }
            });

            const temporaryDirectoryPath = mkdtempSync(join(tmpdir(), `budgie-test-db-${basename(sourceDatabasePath)}-`));
            const path = join(temporaryDirectoryPath, basename(sourceDatabasePath));

            try {
                copyFileSync(sourceDatabasePath, path);
            } catch (error) {
                rmSync(temporaryDirectoryPath, { recursive: true, force: true });
                throw error;
            }

            return { path, temporaryDirectoryPath };
        }),
        ({ temporaryDirectoryPath }) =>
            Effect.sync(() => {
                if (isDefined(temporaryDirectoryPath)) {
                    rmSync(temporaryDirectoryPath, { recursive: true, force: true });
                }
            })
    ).pipe(Effect.map(({ path }) => path));
