import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import { makeTestDbLayer } from '@budgie-at/test-kit';
import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';

import { getErrorMessage } from '@rnw-community/shared';

const syntheticAssertionErrorMessage = 'Synthetic post-build assertion failure';

const getTemporaryDatabaseDirectories = (sourceDatabasePath: string): string[] =>
    readdirSync(tmpdir())
        .filter(name => name.startsWith(`budgie-test-db-${basename(sourceDatabasePath)}-`))
        .sort();

const getUniqueSourceDatabasePath = (sourceDirectoryPath: string, label: string): string =>
    join(sourceDirectoryPath, `${basename(sourceDirectoryPath)}-${label}.db`);

const copyUniqueSourceDatabase = (sourceDirectoryPath: string, label: string): string => {
    const sourceDatabasePath = getUniqueSourceDatabasePath(sourceDirectoryPath, label);
    writeFileSync(sourceDatabasePath, '');

    return sourceDatabasePath;
};

const buildScoped = (sourceDatabasePath: string) => Effect.scoped(Layer.build(makeTestDbLayer(sourceDatabasePath)));

describe('test database lifecycle', () => {
    it.effect('removes the temporary database after a post-build assertion fails', () =>
        Effect.gen(function* () {
            const sourceDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-assertion-source-'));
            const sourceDatabasePath = copyUniqueSourceDatabase(sourceDirectoryPath, 'assertion');
            const exit = yield* Effect.exit(
                Effect.scoped(
                    Effect.gen(function* () {
                        yield* Layer.build(makeTestDbLayer(sourceDatabasePath));

                        return yield* Effect.die(new Error(syntheticAssertionErrorMessage));
                    })
                )
            );

            rmSync(sourceDirectoryPath, { recursive: true, force: true });

            expect(Exit.isFailure(exit) ? getErrorMessage(Cause.squash(exit.cause)) : '').toBe(syntheticAssertionErrorMessage);
            expect(getTemporaryDatabaseDirectories(sourceDatabasePath)).toHaveLength(0);
        })
    );

    it.effect('removes the temporary database after setup fails', () =>
        Effect.gen(function* () {
            const sourceDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-invalid-source-'));
            const sourceDatabasePath = getUniqueSourceDatabasePath(sourceDirectoryPath, 'invalid');
            writeFileSync(sourceDatabasePath, 'not a sqlite database');
            const exit = yield* Effect.exit(buildScoped(sourceDatabasePath));

            rmSync(sourceDirectoryPath, { recursive: true, force: true });

            expect(Exit.isFailure(exit)).toBe(true);
            expect(JSON.stringify(Exit.isFailure(exit) ? Cause.pretty(exit.cause) : '')).toContain('file is not a database');
            expect(getTemporaryDatabaseDirectories(sourceDatabasePath)).toHaveLength(0);
        })
    );

    it.effect.each(['-wal', '-shm', '-journal'])('rejects a source database with a %s sidecar', sidecarSuffix =>
        Effect.gen(function* () {
            const sourceDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-sidecar-source-'));
            const sourceDatabasePath = copyUniqueSourceDatabase(sourceDirectoryPath, sidecarSuffix.slice(1));
            writeFileSync(`${sourceDatabasePath}${sidecarSuffix}`, 'sidecar');
            const exit = yield* Effect.exit(buildScoped(sourceDatabasePath));

            rmSync(sourceDirectoryPath, { recursive: true, force: true });

            expect(Exit.isFailure(exit) ? getErrorMessage(Cause.squash(exit.cause)) : '').toBe(
                `Source database cannot be migrated while ${sourceDatabasePath}${sidecarSuffix} exists`
            );
            expect(getTemporaryDatabaseDirectories(sourceDatabasePath)).toHaveLength(0);
        })
    );
});
