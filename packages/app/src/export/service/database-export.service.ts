import { format } from 'date-fns';
import { sql } from 'drizzle-orm';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

import { db, opSqliteDb } from '../../@generic/drizzle/db/db';

class DatabaseExportService {
    async exportAndShare(): Promise<void> {
        const sourcePath = opSqliteDb.getDbPath();
        const fileName = `budgie-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.db`;
        const destinationPath = `${Paths.cache.uri}/${fileName}`;

        await db.run(sql`PRAGMA wal_checkpoint(FULL)`);

        const sourceFile = new File(sourcePath);
        const destinationFile = new File(destinationPath);

        if (destinationFile.exists) {
            destinationFile.delete();
        }

        sourceFile.copy(destinationFile);

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
