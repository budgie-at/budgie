import { Db, SettingsRepository } from '@budgie/contracts';
import { format } from 'date-fns/format';
import * as Cause from 'effect/Cause';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import { Directory, File, Paths } from 'expo-file-system';
import { zip } from 'react-native-zip-archive';

import { isDefined } from '@rnw-community/shared';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { toNativePath } from '../../@generic/utils/to-native-path.util';
import { BackupDirectoryPickerError } from '../error/backup-directory-picker.error';
import { shareCacheFile } from '../utils/share-cache-file.util';

export class DatabaseExportService extends Context.Service<DatabaseExportService>()('@budgie/app/DatabaseExportService', {
    make: Effect.gen(function* () {
        const settingsRepository = yield* SettingsRepository;
        const isPickerCancellation = Schema.is(
            Schema.Struct({ code: Schema.Literals(['ERR_FILE_PICKING_CANCELLED', 'ERR_PICKER_CANCELLED']) })
        );
        const removeCacheFile = (file: File) =>
            Effect.sync(() => {
                if (file.exists) {
                    file.delete();
                }
            });
        const completedCheckpoint = Schema.Tuple([
            Schema.Struct({ busy: Schema.Literals([0]), log: Schema.Finite, checkpointed: Schema.Finite }).check(
                Schema.makeFilter(checkpoint => checkpoint.log === checkpoint.checkpointed)
            )
        ]);
        const writeArchive = Effect.fnUntraced(function* (archive: File) {
            const { $client: client } = (yield* Db).$primary;

            yield* Effect.acquireUseRelease(
                Effect.sync(() => new File(Paths.cache, archive.name.replace(/\.zip$/u, ''))),
                databaseCopy =>
                    Effect.gen(function* () {
                        yield* Effect.gen(function* () {
                            const connection = yield* client.reserve;

                            const checkpointRows = yield* connection.executeRaw(...client`PRAGMA wal_checkpoint(FULL)`.compile());

                            yield* Schema.decodeUnknownEffect(completedCheckpoint)(checkpointRows).pipe(Effect.orDie);
                            yield* Effect.promise(() => new File(DATABASE_DIRECTORY, DB_NAME).copy(databaseCopy));
                        }).pipe(Effect.scoped);
                        yield* Effect.promise(() => zip([toNativePath(databaseCopy.uri)], toNativePath(archive.uri)));
                    }),
                removeCacheFile
            );
        });

        return {
            saveBackup: Effect.fn('DatabaseExportService.saveBackup')(function* () {
                const directory = yield* Effect.tryPromise({
                    try: () => Directory.pickDirectoryAsync(),
                    catch: cause => BackupDirectoryPickerError.make({ cause })
                }).pipe(
                    Effect.catchTags({
                        BackupDirectoryPickerError: error =>
                            isPickerCancellation(error.cause) ? Effect.succeed(null) : Effect.die(error.cause)
                    })
                );

                if (!isDefined(directory)) {
                    return false;
                }

                const timestamp = yield* Clock.currentTimeMillis;

                yield* Effect.acquireUseRelease(
                    Effect.sync(() => new File(Paths.cache, `budgie-backup-${format(new Date(timestamp), 'yyyy-MM-dd-HHmmssSSS')}.db.zip`)),
                    archive =>
                        writeArchive(archive).pipe(
                            Effect.andThen(
                                Effect.tryPromise({
                                    try: () => archive.copy(directory),
                                    catch: cause => new Cause.UnknownError(cause)
                                }).pipe(Effect.catch(error => Effect.die(error.cause)))
                            )
                        ),
                    removeCacheFile
                );
                const backedUpAtMs = yield* Clock.currentTimeMillis;
                yield* settingsRepository.update({ lastBackupAt: new Date(backedUpAtMs) });

                return true;
            }),
            exportAndShare: Effect.fn('DatabaseExportService.exportAndShare')(function* () {
                yield* shareCacheFile('budgie-backup', 'db.zip', writeArchive, { mimeType: 'application/zip', UTI: 'public.zip-archive' });
            })
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseExportService, DatabaseExportService.make).pipe(Layer.provide(SettingsRepository.layer));
}
