import { copyFileSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTestDb } from '@budgie-at/test-kit';
import { describe, expect, it } from 'vitest';

import { getErrorMessage } from '@rnw-community/shared';

const scenarioDirectory = resolve(fileURLToPath(import.meta.url), '..');
const preMigrationFixturePath = resolve(scenarioDirectory, '../../../fixtures/debt-migration/pre-0033.db');
const syntheticAssertionErrorMessage = 'Synthetic post-build assertion failure';

const getTemporaryDatabaseDirectories = (sourceDatabasePath: string): string[] =>
    readdirSync(tmpdir())
        .filter(name => name.startsWith(`budgie-test-db-${basename(sourceDatabasePath)}-`))
        .sort();

const getUniqueSourceDatabasePath = (sourceDirectoryPath: string, label: string): string =>
    join(sourceDirectoryPath, `${basename(sourceDirectoryPath)}-${label}.db`);

const copyUniqueSourceDatabase = (sourceDirectoryPath: string, label: string): string => {
    const sourceDatabasePath = getUniqueSourceDatabasePath(sourceDirectoryPath, label);
    copyFileSync(preMigrationFixturePath, sourceDatabasePath);

    return sourceDatabasePath;
};

describe('test database lifecycle', () => {
    it('removes the temporary database after a post-build assertion fails', async () => {
        const sourceDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-assertion-source-'));
        const sourceDatabasePath = copyUniqueSourceDatabase(sourceDirectoryPath, 'assertion');
        let syntheticAssertionError: unknown;

        try {
            const db = buildTestDb(sourceDatabasePath);

            try {
                throw new Error(syntheticAssertionErrorMessage);
            } finally {
                await db.$client.closeAsync();
            }
        } catch (error) {
            syntheticAssertionError = error;
        } finally {
            rmSync(sourceDirectoryPath, { recursive: true, force: true });
        }

        expect(getErrorMessage(syntheticAssertionError)).toBe(syntheticAssertionErrorMessage);
        expect(getTemporaryDatabaseDirectories(sourceDatabasePath)).toHaveLength(0);
    });

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
