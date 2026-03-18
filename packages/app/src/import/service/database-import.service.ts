import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import * as Updates from 'expo-updates';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { expoDb } from '../../@generic/drizzle/db/db';

// eslint-disable-next-line lingui/no-unlocalized-strings
const CLOSED_RESOURCE_ERROR = 'Access to closed resource';

class DatabaseImportService {
    async replaceFromUri(sourceUri: string): Promise<void> {
        const destinationPath = this.getDestinationPath();
        const tempPath = `${Paths.cache.uri}/import-temp.db`;

        await this.closeDatabaseIfOpen();
        this.clearDatabaseGlobals();

        [
            destinationPath,
            `${destinationPath}-wal`,
            `${destinationPath}-shm`,
            tempPath
        ].forEach(path => void this.deleteFileIfExists(path));

        const tempFile = new File(tempPath);
        new File(sourceUri).copy(tempFile);
        tempFile.move(new File(destinationPath));
    }

    async importFromUri(sourceUri: string): Promise<void> {
        await this.replaceFromUri(sourceUri);
        await Updates.reloadAsync();
    }

    private clearDatabaseGlobals() {
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__expoSqliteDb__ = undefined;
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__drizzleDb__ = undefined;
    }

    private async closeDatabaseIfOpen() {
        try {
            await expoDb.closeAsync();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);

            if (!message.includes(CLOSED_RESOURCE_ERROR)) {
                throw error;
            }
        }
    }

    private deleteFileIfExists(path: string) {
        const file = new File(path);

        if (file.exists) {
            file.delete();
        }
    }

    private getDestinationPath() {
        return `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;
    }
}

export const databaseImportService = new DatabaseImportService();
