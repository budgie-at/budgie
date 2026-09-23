import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import { buildTestDb } from '@budgie-at/test-kit';
import Database from 'better-sqlite3';

import { LaterDebtTransferMigrationAssertions } from './later-debt-transfer-migration.assertions';

import type { DB } from '@budgie/contracts';

export class LaterDebtTransferMigrationScenario {
    constructor(private readonly fixturePath: string) {}

    async run(): Promise<void> {
        const temporaryDirectoryPath = mkdtempSync(join(tmpdir(), 'budgie-later-debt-transfer-'));
        const assertions = new LaterDebtTransferMigrationAssertions();
        let fixtureSqlite: Database.Database | null = null;
        let db: DB | null = null;

        try {
            fixtureSqlite = this.openFixtureCopy(temporaryDirectoryPath);
            const beforeMigration = assertions.snapshot(fixtureSqlite);
            db = buildTestDb(this.fixturePath);
            await assertions.assert(db, beforeMigration);
        } finally {
            await this.closeResources(db, fixtureSqlite, temporaryDirectoryPath);
        }
    }

    private openFixtureCopy(temporaryDirectoryPath: string): Database.Database {
        const temporaryFixturePath = join(temporaryDirectoryPath, basename(this.fixturePath));
        copyFileSync(this.fixturePath, temporaryFixturePath);

        return new Database(temporaryFixturePath, { readonly: true });
    }

    private async closeResources(db: DB | null, fixtureSqlite: Database.Database | null, temporaryDirectoryPath: string): Promise<void> {
        try {
            await db?.$client.closeAsync();
        } finally {
            try {
                fixtureSqlite?.close();
            } finally {
                rmSync(temporaryDirectoryPath, { recursive: true, force: true });
            }
        }
    }
}
