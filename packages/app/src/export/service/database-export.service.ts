import { format } from 'date-fns';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import * as SQLite from 'expo-sqlite';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { expoDb } from '../../@generic/drizzle/db/db';

class DatabaseExportService {
    async exportAndShare(): Promise<void> {
        const sourcePath = `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;
        const fileName = `budgie-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.db`;
        const destinationPath = `${Paths.cache.uri}/${fileName}`;

        await expoDb.execAsync('PRAGMA wal_checkpoint(FULL)'); // eslint-disable-line lingui/no-unlocalized-strings

        const sourceFile = new File(sourcePath);
        const destinationFile = new File(destinationPath);

        if (destinationFile.exists) {
            destinationFile.delete();
        }

        await sourceFile.copy(destinationFile);

        const canShare = await isAvailableAsync();
        if (canShare) {
            await shareAsync(destinationPath, {
                mimeType: 'application/x-sqlite3',
                dialogTitle: fileName,
                UTI: 'public.database'
            });
        }
    }
}

export const databaseExportService = new DatabaseExportService();
