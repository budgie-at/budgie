import { format } from 'date-fns/format';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import * as SQLite from 'expo-sqlite';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { expoDb } from '../../@generic/drizzle/db/db';

export class DatabaseExportService extends Context.Service<DatabaseExportService>()('@budgie/app/DatabaseExportService', {
    make: Effect.succeed({
        exportAndShare: Effect.fn('DatabaseExportService.exportAndShare')(function* () {
            const sourcePath = `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;
            const fileName = `budgie-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.db`;
            const destinationPath = `${Paths.cache.uri}/${fileName}`;

            yield* Effect.promise(() => expoDb.execAsync('PRAGMA wal_checkpoint(FULL)')); // oxlint-disable-line lingui/no-unlocalized-strings

            const sourceFile = new File(sourcePath);
            const destinationFile = new File(destinationPath);

            if (destinationFile.exists) {
                destinationFile.delete();
            }

            yield* Effect.promise(() => sourceFile.copy(destinationFile));

            const canShare = yield* Effect.promise(() => isAvailableAsync());
            if (canShare) {
                yield* Effect.promise(() =>
                    shareAsync(destinationPath, {
                        mimeType: 'application/x-sqlite3',
                        dialogTitle: fileName,
                        UTI: 'public.database'
                    })
                );
            }
        })
    })
}) {
    static readonly layer = Layer.effect(DatabaseExportService, DatabaseExportService.make);
}
