import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import * as Updates from 'expo-updates';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { expoDb } from '../../@generic/drizzle/db/db';

class DatabaseImportService {
    async importFromUri(sourceUri: string): Promise<void> {
        await expoDb.closeAsync();

        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__expoSqliteDb__ = undefined;
        // eslint-disable-next-line no-underscore-dangle, no-undefined
        global.__drizzleDb__ = undefined;

        const destinationPath = `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;
        const destinationFile = new File(destinationPath);

        if (destinationFile.exists) {
            destinationFile.delete();
        }

        const walPath = `${destinationPath}-wal`;
        const shmPath = `${destinationPath}-shm`;
        const walFile = new File(walPath);
        const shmFile = new File(shmPath);

        if (walFile.exists) {
            walFile.delete();
        }

        if (shmFile.exists) {
            shmFile.delete();
        }

        const tempPath = `${Paths.cache.uri}/import-temp.db`;
        const tempFile = new File(tempPath);

        if (tempFile.exists) {
            tempFile.delete();
        }

        const sourceFile = new File(sourceUri);
        sourceFile.copy(tempFile);

        tempFile.move(destinationFile);

        await Updates.reloadAsync();
    }
}

export const databaseImportService = new DatabaseImportService();
