import { Log } from '@budgie/logger';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { expoDb } from '../../@generic/drizzle/db/db';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { aiStorageReplacementService } from '../../ai/service/ai-storage-replacement.service';
import { authService } from '../../auth/service/auth.service';

class DatabaseImportService {
    @Log(
        (sourceUri, backupPin) => `enter sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)}`,
        (result, ...[sourceUri, backupPin]) =>
            `done result=${String(result)} sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)}`,
        (error, sourceUri, backupPin) =>
            `throw sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)} error=${getErrorMessage(error)}`
    )
    async importFromUri(sourceUri: string, backupPin: string | null): Promise<void> {
        await this.replaceFromUri(sourceUri);
        await authService.persistPin(backupPin);
        await reloadApp();
    }

    @Log(
        (sourceUri, backupPin) => `enter sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)}`,
        (result, ...[sourceUri, backupPin]) => `done result=${result} sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)}`,
        (error, sourceUri, backupPin) =>
            `throw sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)} error=${getErrorMessage(error)}`
    )
    async canOpenBackup(sourceUri: string, backupPin: string | null): Promise<boolean> {
        const backupFile = new File(sourceUri);
        const backupDatabase = await SQLite.openDatabaseAsync(backupFile.name, { useNewConnection: true }, backupFile.parentDirectory.uri);

        try {
            if (isNotEmptyString(backupPin)) {
                await backupDatabase.execAsync(`PRAGMA key = '${backupPin}';`); // oxlint-disable-line lingui/no-unlocalized-strings
            }

            await backupDatabase.execAsync('SELECT count(*) FROM sqlite_master;'); // oxlint-disable-line lingui/no-unlocalized-strings

            return true;
        } catch {
            return false;
        } finally {
            await backupDatabase.closeAsync();
        }
    }

    async replaceFromUri(sourceUri: string): Promise<void> {
        const destinationPath = this.getDestinationPath();
        const tempPath = `${Paths.cache.uri}/import-temp.db`;

        await aiStorageReplacementService.pauseLongLivedRuntime();
        await expoDb.closeAsync();
        this.clearDatabaseGlobals();
        this.deleteDestinationFiles(destinationPath, tempPath);
        await this.replaceDestinationFile(sourceUri, tempPath, destinationPath);
        await this.copyDatabaseSidecars(sourceUri, destinationPath);
    }

    private async replaceDestinationFile(sourceUri: string, tempPath: string, destinationPath: string): Promise<void> {
        const tempFile = new File(tempPath);
        await new File(sourceUri).copy(tempFile);
        await tempFile.move(new File(destinationPath));
    }

    private async copyDatabaseSidecars(sourceUri: string, destinationPath: string): Promise<void> {
        await this.copyFileIfExists(`${sourceUri}-wal`, `${destinationPath}-wal`);
        await this.copyFileIfExists(`${sourceUri}-shm`, `${destinationPath}-shm`);
    }

    private deleteDestinationFiles(destinationPath: string, tempPath: string): void {
        this.deleteFileIfExists(destinationPath);
        this.deleteFileIfExists(`${destinationPath}-wal`);
        this.deleteFileIfExists(`${destinationPath}-shm`);
        this.deleteFileIfExists(tempPath);
    }

    private clearDatabaseGlobals() {
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__expoSqliteDb__ = undefined;
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__drizzleDb__ = undefined;
    }

    private deleteFileIfExists(path: string): void {
        const file = new File(path);

        if (file.exists) {
            file.delete();
        }
    }

    private async copyFileIfExists(sourcePath: string, destinationPath: string): Promise<void> {
        const sourceFile = new File(sourcePath);

        if (sourceFile.exists) {
            await sourceFile.copy(new File(destinationPath));
        }
    }

    private getDestinationPath(): string {
        return `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;
    }
}

export const databaseImportService = new DatabaseImportService();
