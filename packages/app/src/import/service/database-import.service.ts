import { Log } from '@budgie/logger';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { expoDb } from '../../@generic/drizzle/db/db';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { aiStorageReplacementService } from '../../ai/service/ai-storage-replacement.service';
import { authService } from '../../auth/service/auth.service';

class DatabaseImportService {
    private static readonly PROBE_DATABASE_NAME = 'import-probe.db';

    @Log(
        (sourceUri, backupPin) => `enter sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)}`,
        (result, ...[sourceUri, backupPin]) =>
            `done result=${String(result)} sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)}`,
        (error, sourceUri, backupPin) =>
            `throw sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)} error=${getErrorMessage(error)}`
    )
    async importFromUri(sourceUri: string, backupPin: string | null): Promise<void> {
        const previousPin = await authService.getPin();

        await authService.persistPin(backupPin);

        try {
            await this.replaceFromUri(sourceUri);
        } catch (error) {
            await authService.persistPin(previousPin);
            throw error;
        }

        await reloadApp();
    }

    @Log(
        (sourceUri, backupPin) => `enter sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)}`,
        (result, ...[sourceUri, backupPin]) => `done result=${result} sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)}`,
        (error, sourceUri, backupPin) =>
            `throw sourceUri="${sourceUri}" hasBackupPin=${isNotEmptyString(backupPin)} error=${getErrorMessage(error)}`
    )
    async canOpenBackup(sourceUri: string, backupPin: string | null): Promise<boolean> {
        const probePath = `${Paths.cache.uri}/${DatabaseImportService.PROBE_DATABASE_NAME}`;

        this.deleteProbeFiles(probePath);

        try {
            await new File(sourceUri).copy(new File(probePath));

            return await this.readProbeDatabase(backupPin);
        } catch {
            return false;
        } finally {
            this.deleteProbeFiles(probePath);
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

    private async readProbeDatabase(backupPin: string | null): Promise<boolean> {
        const probeDatabase = await SQLite.openDatabaseAsync(
            DatabaseImportService.PROBE_DATABASE_NAME,
            { useNewConnection: true },
            Paths.cache.uri
        );

        try {
            if (isNotEmptyString(backupPin)) {
                await probeDatabase.execAsync(`PRAGMA key = '${backupPin}';`); // oxlint-disable-line lingui/no-unlocalized-strings
            }

            // oxlint-disable-next-line lingui/no-unlocalized-strings
            const tables = await probeDatabase.getAllAsync<unknown>('SELECT name FROM sqlite_master;');

            return isNotEmptyArray(tables);
        } finally {
            await probeDatabase.closeAsync();
        }
    }

    private deleteProbeFiles(probePath: string): void {
        this.deleteFileIfExists(probePath);
        this.deleteFileIfExists(`${probePath}-wal`);
        this.deleteFileIfExists(`${probePath}-shm`);
    }

    private async replaceDestinationFile(sourceUri: string, tempPath: string, destinationPath: string): Promise<void> {
        const tempFile = new File(tempPath);
        await new File(sourceUri).copy(tempFile);
        await tempFile.move(new File(destinationPath));
    }

    private async copyDatabaseSidecars(sourceUri: string, destinationPath: string): Promise<void> {
        try {
            await this.copyFileIfExists(`${sourceUri}-wal`, `${destinationPath}-wal`);
            await this.copyFileIfExists(`${sourceUri}-shm`, `${destinationPath}-shm`);
        } catch {
            this.deleteFileIfExists(`${destinationPath}-wal`);
            this.deleteFileIfExists(`${destinationPath}-shm`);
        }
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
