import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File } from 'expo-file-system';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { shareCacheFile } from '../utils/share-cache-file.util';

export class DatabaseExportService extends Context.Service<DatabaseExportService>()('@budgie/app/DatabaseExportService', {
    make: Effect.succeed({
        exportAndShare: Effect.fn('DatabaseExportService.exportAndShare')(function* () {
            const { $client: client } = yield* Db;

            yield* client.unsafe('PRAGMA wal_checkpoint(FULL)').raw; // oxlint-disable-line lingui/no-unlocalized-strings
            yield* shareCacheFile('budgie-backup', 'db', file => Effect.promise(() => new File(DATABASE_DIRECTORY, DB_NAME).copy(file)), {
                mimeType: 'application/x-sqlite3',
                UTI: 'public.database'
            });
        })
    })
}) {
    static readonly layer = Layer.effect(DatabaseExportService, DatabaseExportService.make);
}
