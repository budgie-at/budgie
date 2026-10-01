import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { isNotEmptyString } from '@rnw-community/shared';

import { reloadApp } from '../../utils/reload-app.util';
import { DATABASE_DIRECTORY } from '../constant/database-directory.constant';
import { DB_NAME } from '../constant/db-name.constant';
import { openSqliteClient } from '../utils/open-sqlite-client.util';
import { readDatabaseKey } from '../utils/read-database-key.util';

export class DatabaseRestoreService extends Context.Service<DatabaseRestoreService>()('@budgie/app/DatabaseRestoreService', {
    make: Effect.sync(() => {
        const probeDatabaseName = 'restore-probe.db';
        const databaseFileSuffixes = ['', '-wal', '-shm'];

        const moveIfExists = Effect.fnUntraced(function* (sourceName: string, destinationName: string) {
            const sourceFile = new File(DATABASE_DIRECTORY, sourceName);

            if (sourceFile.exists) {
                yield* Effect.promise(() => sourceFile.move(new File(DATABASE_DIRECTORY, destinationName)));
            }
        });

        const canOpenProbe = Effect.fn('DatabaseRestoreService.canOpenProbe')(function* () {
            return yield* openSqliteClient(probeDatabaseName, yield* readDatabaseKey).pipe(
                Effect.as(true),
                Effect.catch(() => Effect.succeed(false))
            );
        }, Effect.scoped);

        const restoreFromUri = Effect.fn('DatabaseRestoreService.restoreFromUri')(function* (sourceUri: string) {
            const probeFile = new File(DATABASE_DIRECTORY, probeDatabaseName);

            if (probeFile.exists) {
                probeFile.delete();
            }

            yield* Effect.promise(() => new File(sourceUri).copy(probeFile));

            if (!(yield* canOpenProbe())) {
                probeFile.delete();

                return true;
            }

            const unopenableName = `${DB_NAME}.unopenable-${Date.now()}`;

            yield* Effect.forEach(databaseFileSuffixes, suffix => moveIfExists(`${DB_NAME}${suffix}`, `${unopenableName}${suffix}`), {
                discard: true
            });
            yield* moveIfExists(probeDatabaseName, DB_NAME);
            yield* Effect.promise(() => reloadApp());

            return false;
        });

        return {
            restoreFromPickedBackup: Effect.fn('DatabaseRestoreService.restoreFromPickedBackup')(function* () {
                const result = yield* Effect.promise(() =>
                    DocumentPicker.getDocumentAsync({
                        type: ['application/x-sqlite3', 'application/octet-stream', '*/*'],
                        copyToCacheDirectory: true
                    })
                );
                const uri = result.assets?.at(0)?.uri;

                if (result.canceled || !isNotEmptyString(uri)) {
                    return false;
                }

                return yield* restoreFromUri(uri);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseRestoreService, DatabaseRestoreService.make);
}
