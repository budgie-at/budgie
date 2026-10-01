import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import { buildTestDb } from '@budgie-at/test-kit';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { getErrorMessage } from '@rnw-community/shared';

import { TestLayer } from '../../harness';

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

describe('test database lifecycle', () => {
    it.effect('removes the temporary database after a post-build assertion fails', () =>
        Effect.gen(function* () {
            const sourceDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-assertion-source-'));
            const sourceDatabasePath = copyUniqueSourceDatabase(sourceDirectoryPath, 'assertion');
            let syntheticAssertionError: unknown;

            try {
                const db = buildTestDb(sourceDatabasePath);

                try {
                    throw new Error(syntheticAssertionErrorMessage);
                } finally {
                    yield* Effect.promise(() => db.$client.closeAsync());
                }
            } catch (error) {
                syntheticAssertionError = error;
            } finally {
                rmSync(sourceDirectoryPath, { recursive: true, force: true });
            }

            expect(getErrorMessage(syntheticAssertionError)).toBe(syntheticAssertionErrorMessage);
            expect(getTemporaryDatabaseDirectories(sourceDatabasePath)).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it('removes the temporary database after setup fails', () => {
        const sourceDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-invalid-source-'));
        const sourceDatabasePath = getUniqueSourceDatabasePath(sourceDirectoryPath, 'invalid');
        writeFileSync(sourceDatabasePath, 'not a sqlite database');

        try {
            expect(() => buildTestDb(sourceDatabasePath)).toThrow('file is not a database');
            expect(getTemporaryDatabaseDirectories(sourceDatabasePath)).toHaveLength(0);
        } finally {
            rmSync(sourceDirectoryPath, { recursive: true, force: true });
        }
    });

    it.each(['-wal', '-shm', '-journal'])('rejects a source database with a %s sidecar', sidecarSuffix => {
        const sourceDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-sidecar-source-'));
        const sourceDatabasePath = copyUniqueSourceDatabase(sourceDirectoryPath, sidecarSuffix.slice(1));
        writeFileSync(`${sourceDatabasePath}${sidecarSuffix}`, 'sidecar');

        try {
            expect(() => buildTestDb(sourceDatabasePath)).toThrow(
                `Source database cannot be migrated while ${sourceDatabasePath}${sidecarSuffix} exists`
            );
            expect(getTemporaryDatabaseDirectories(sourceDatabasePath)).toHaveLength(0);
        } finally {
            rmSync(sourceDirectoryPath, { recursive: true, force: true });
        }
    });
});
