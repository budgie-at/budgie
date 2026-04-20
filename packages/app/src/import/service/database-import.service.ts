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
        const sourceWalPath = `${sourceUri}-wal`;
        const sourceShmPath = `${sourceUri}-shm`;
        const destinationWalPath = `${destinationPath}-wal`;
        const destinationShmPath = `${destinationPath}-shm`;

        await expoDb.closeAsync();
        this.clearDatabaseGlobals();

        [destinationPath, destinationWalPath, destinationShmPath, tempPath].forEach(path => void this.deleteFileIfExists(path));

        const tempFile = new File(tempPath);
        new File(sourceUri).copy(tempFile);
        tempFile.move(new File(destinationPath));
        this.copyFileIfExists(sourceWalPath, destinationWalPath);
        this.copyFileIfExists(sourceShmPath, destinationShmPath);
    }

    async importFromUri(sourceUri: string): Promise<void> {
        await this.replaceFromUri(sourceUri);
        await authService.clearAllPins();
        await reloadApp();
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
