import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { expoDb } from '../../@generic/drizzle/db/db';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { authService } from '../../auth/service/auth.service';

class DatabaseImportService {
    async replaceFromUri(sourceUri: string): Promise<void> {
        const destinationPath = this.getDestinationPath();
        const tempPath = `${Paths.cache.uri}/import-temp.db`;

        await expoDb.closeAsync();
        this.clearDatabaseGlobals();
        this.deleteDestinationFiles(destinationPath, tempPath);
        this.replaceDestinationFile(sourceUri, tempPath, destinationPath);
        this.copyDatabaseSidecars(sourceUri, destinationPath);
    }

    async importFromUri(sourceUri: string): Promise<void> {
        await this.replaceFromUri(sourceUri);
        await authService.clearAllPins();
        await reloadApp();
    }

    private replaceDestinationFile(sourceUri: string, tempPath: string, destinationPath: string): void {
        const tempFile = new File(tempPath);
        new File(sourceUri).copy(tempFile);
        tempFile.move(new File(destinationPath));
    }

    private copyDatabaseSidecars(sourceUri: string, destinationPath: string): void {
        this.copyFileIfExists(`${sourceUri}-wal`, `${destinationPath}-wal`);
        this.copyFileIfExists(`${sourceUri}-shm`, `${destinationPath}-shm`);
    }

    private deleteDestinationFiles(destinationPath: string, tempPath: string): void {
        [destinationPath, `${destinationPath}-wal`, `${destinationPath}-shm`, tempPath].forEach(path => void this.deleteFileIfExists(path));
    }

    private clearDatabaseGlobals() {
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__expoSqliteDb__ = undefined;
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__drizzleDb__ = undefined;
    }

    private deleteFileIfExists(path: string) {
        const file = new File(path);

        if (file.exists) {
            file.delete();
        }
    }

    private copyFileIfExists(sourcePath: string, destinationPath: string) {
        const sourceFile = new File(sourcePath);

        if (sourceFile.exists) {
            sourceFile.copy(new File(destinationPath));
        }
    }

    private getDestinationPath() {
        return `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;
    }
}

export const databaseImportService = new DatabaseImportService();
