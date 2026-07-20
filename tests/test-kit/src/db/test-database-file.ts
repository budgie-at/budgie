import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import Database from 'better-sqlite3';

import { isDefined } from '@rnw-community/shared';

export class TestDatabaseFile {
    readonly path: string;

    private readonly temporaryDirectoryPath: string | null;
    private sqlite: Database.Database | null = null;

    constructor(sourceDatabasePath: string | null) {
        if (!isDefined(sourceDatabasePath)) {
            this.path = ':memory:';
            this.temporaryDirectoryPath = null;

            return;
        }

        this.assertNoSidecars(sourceDatabasePath);
        this.temporaryDirectoryPath = mkdtempSync(join(tmpdir(), `budgie-test-db-${basename(sourceDatabasePath)}-`));
        this.path = join(this.temporaryDirectoryPath, basename(sourceDatabasePath));

        try {
            copyFileSync(sourceDatabasePath, this.path);
        } catch (error) {
            this.removeTemporaryDirectory();
            throw error;
        }
    }

    open(): Database.Database {
        try {
            this.sqlite = new Database(this.path);
            this.sqlite.pragma('journal_mode = WAL');
            this.sqlite.pragma('foreign_keys = ON');

            return this.sqlite;
        } catch (error) {
            this.close();
            throw error;
        }
    }

    close(): void {
        try {
            this.sqlite?.close();
        } finally {
            this.sqlite = null;
            this.removeTemporaryDirectory();
        }
    }

    private assertNoSidecar(sourceDatabasePath: string, suffix: string): void {
        if (existsSync(`${sourceDatabasePath}${suffix}`)) {
            throw new Error(`Source database cannot be migrated while ${sourceDatabasePath}${suffix} exists`);
        }
    }

    private assertNoSidecars(sourceDatabasePath: string): void {
        this.assertNoSidecar(sourceDatabasePath, '-wal');
        this.assertNoSidecar(sourceDatabasePath, '-shm');
        this.assertNoSidecar(sourceDatabasePath, '-journal');
    }

    private removeTemporaryDirectory(): void {
        if (isDefined(this.temporaryDirectoryPath)) {
            rmSync(this.temporaryDirectoryPath, { recursive: true, force: true });
        }
    }
}
