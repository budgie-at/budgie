/* eslint-disable lingui/no-unlocalized-strings */
import { SettingsRepository } from '@budgie/contracts';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { isNotEmptyString } from '@rnw-community/shared';

import { DB_NAME } from '../constant/db-name.constant';
import { expoDb } from '../db/db';
import * as schema from '../db/schema';

import { databaseLifecycleService } from './database-lifecycle.service';

import { RekeyParamsInterface } from './interface/rekey-params.interface';
import { RekeyPathsInterface } from './interface/rekey-paths.interface';

class DatabaseRekeyService {
    async rekey(params: RekeyParamsInterface, onCommit: () => Promise<void>): Promise<void> {
        const paths = this.getPaths();

        try {
            await this.prepare(paths, params);
            await this.commit(paths, onCommit);
        } catch (error) {
            await this.rollback(paths);
            throw error;
        } finally {
            this.deleteDatabaseFiles(paths.tempDatabasePath);
            this.deleteDatabaseFiles(paths.backupPath);
        }
    }

    private async prepare(paths: RekeyPathsInterface, params: RekeyParamsInterface): Promise<void> {
        this.deleteDatabaseFiles(paths.tempDatabasePath);
        this.deleteDatabaseFiles(paths.backupPath);
        await this.exportDatabase(paths.tempDatabasePath, params.nextKey);

        if (params.nextSettings) {
            await this.updateMigratedDatabaseSettings(paths.tempDatabaseName, params.nextKey, params.nextSettings);
        }
    }

    private async commit(paths: RekeyPathsInterface, onCommit: () => Promise<void>): Promise<void> {
        await databaseLifecycleService.close();
        this.deleteDestinationSidecars(paths.destinationPath);
        this.moveExistingDatabaseToBackup(paths.destinationPath, paths.backupPath);
        new File(paths.tempDatabasePath).move(new File(paths.destinationPath));
        await onCommit();
        this.deleteDatabaseFiles(paths.backupPath);
    }

    private async rollback(paths: RekeyPathsInterface): Promise<void> {
        this.deleteFileIfExists(paths.destinationPath);
        this.restoreBackupDatabase(paths.backupPath, paths.destinationPath);
    }

    private async exportDatabase(tempDatabasePath: string, nextKey: string | null): Promise<void> {
        await expoDb.execAsync('PRAGMA wal_checkpoint(FULL)');
        await expoDb.execAsync('PRAGMA journal_mode = DELETE');
        await expoDb.execAsync(
            `ATTACH DATABASE '${this.escapeSqlString(tempDatabasePath)}' AS migrated KEY '${this.escapeSqlString(nextKey ?? '')}';`
        );

        try {
            await expoDb.execAsync(`SELECT sqlcipher_export('migrated');`);
        } finally {
            await expoDb.execAsync('DETACH DATABASE migrated;');
        }
    }

    private async updateMigratedDatabaseSettings(
        tempDatabaseName: string,
        nextKey: string | null,
        nextSettings: NonNullable<RekeyParamsInterface['nextSettings']>
    ): Promise<void> {
        const tempDatabase = await SQLite.openDatabaseAsync(tempDatabaseName, { enableChangeListener: true }, Paths.cache.uri);

        try {
            if (isNotEmptyString(nextKey)) {
                await tempDatabase.execAsync(`PRAGMA key = '${this.escapeSqlString(nextKey)}';`);
            }

            const tempSettingsRepository = new SettingsRepository(drizzle(tempDatabase, { schema }));
            await tempSettingsRepository.update(nextSettings);
        } finally {
            await tempDatabase.closeAsync();
        }
    }

    private getPaths(): RekeyPathsInterface {
        const tempDatabaseName = 'auth-migration.db';
        const destinationPath = `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;

        return {
            tempDatabaseName,
            tempDatabasePath: `${Paths.cache.uri}/${tempDatabaseName}`,
            destinationPath,
            backupPath: `${destinationPath}.bak`
        };
    }

    private moveExistingDatabaseToBackup(destinationPath: string, backupPath: string): void {
        const destinationFile = new File(destinationPath);

        if (destinationFile.exists) {
            destinationFile.move(new File(backupPath));
        }
    }

    private restoreBackupDatabase(backupPath: string, destinationPath: string): void {
        const backupFile = new File(backupPath);

        if (backupFile.exists) {
            backupFile.move(new File(destinationPath));
        }
    }

    private deleteDestinationSidecars(destinationPath: string): void {
        this.deleteFileIfExists(`${destinationPath}-wal`);
        this.deleteFileIfExists(`${destinationPath}-shm`);
    }

    private deleteDatabaseFiles(databasePath: string): void {
        this.deleteFileIfExists(databasePath);
        this.deleteFileIfExists(`${databasePath}-wal`);
        this.deleteFileIfExists(`${databasePath}-shm`);
    }

    private deleteFileIfExists(path: string): void {
        const file = new File(path);

        if (file.exists) {
            file.delete();
        }
    }

    private escapeSqlString(value: string): string {
        return value.replaceAll("'", "''");
    }
}

export const databaseRekeyService = new DatabaseRekeyService();
