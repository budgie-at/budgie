import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File, Paths } from 'expo-file-system';
import { zip } from 'react-native-zip-archive';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { toNativePath } from '../../@generic/utils/to-native-path.util';
import { shareCacheFile } from '../utils/share-cache-file.util';

export class DatabaseExportService extends Context.Service<DatabaseExportService>()('@budgie/app/DatabaseExportService', {
    make: Effect.succeed({
        exportAndShare: Effect.fn('DatabaseExportService.exportAndShare')(function* () {
            const { $client: client } = yield* Db;

            yield* client`PRAGMA wal_checkpoint(FULL)`.raw;
            yield* shareCacheFile(
                'budgie-backup',
                'db.zip',
                archive =>
                    Effect.gen(function* () {
                        const databaseCopy = new File(Paths.cache, archive.name.replace(/\.zip$/u, ''));

                        yield* Effect.promise(() => new File(DATABASE_DIRECTORY, DB_NAME).copy(databaseCopy)).pipe(
                            Effect.andThen(Effect.promise(() => zip(toNativePath(databaseCopy.uri), toNativePath(archive.uri)))),
                            Effect.ensuring(
                                Effect.sync(() => {
                                    if (databaseCopy.exists) {
                                        databaseCopy.delete();
                                    }
                                })
                            )
                        );
                    }),
                { mimeType: 'application/zip', UTI: 'public.zip-archive' }
            );
        })
    })
}) {
    static readonly layer = Layer.effect(DatabaseExportService, DatabaseExportService.make);
}
