import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { isNotEmptyString } from '@rnw-community/shared';

import { reloadApp } from '../../utils/reload-app.util';
import { DATABASE_DIRECTORY } from '../constant/database-directory.constant';
import { DB_NAME } from '../constant/db-name.constant';
import { UnsupportedBackupError } from '../error/unsupported-backup.error';

import { isSupportedMigrationCreatedAt } from './is-supported-migration-created-at.util';
import { openSqliteClient } from './open-sqlite-client.util';
import { readDatabaseKey } from './read-database-key.util';
import { readLastMigrationCreatedAt } from './read-last-migration-created-at.util';
import { resolveBackupFile } from './resolve-backup-file.util';

const probeDatabaseName = 'restore-probe.db';

const moveIfExists = Effect.fnUntraced(function* (sourceName: string, destinationName: string) {
    const sourceFile = new File(DATABASE_DIRECTORY, sourceName);

    if (sourceFile.exists) {
        yield* Effect.promise(() => sourceFile.move(new File(DATABASE_DIRECTORY, destinationName)));
    }
});

const verifyProbe = Effect.fn('restoreDatabaseFromPickedBackup.verifyProbe')(function* () {
    const lastCreatedAt = yield* readLastMigrationCreatedAt(yield* openSqliteClient(probeDatabaseName, yield* readDatabaseKey));

    if (!isSupportedMigrationCreatedAt(lastCreatedAt)) {
        return yield* new UnsupportedBackupError();
    }
}, Effect.scoped);

const restoreFromUri = Effect.fn('restoreDatabaseFromPickedBackup.restoreFromUri')(function* (sourceUri: string) {
    const probeFile = new File(DATABASE_DIRECTORY, probeDatabaseName);

    if (probeFile.exists) {
        probeFile.delete();
    }

    const backupUri = yield* resolveBackupFile(sourceUri);

    yield* Effect.promise(() => new File(backupUri).copy(probeFile));
    yield* verifyProbe().pipe(
        Effect.onError(() =>
            Effect.sync(() => {
                probeFile.delete();
            })
        )
    );

    const unopenableName = `${DB_NAME}.unopenable-${Date.now()}`;

    yield* Effect.forEach(['', '-wal', '-shm'], suffix => moveIfExists(`${DB_NAME}${suffix}`, `${unopenableName}${suffix}`), {
        discard: true
    });
    yield* moveIfExists(probeDatabaseName, DB_NAME);
    yield* Effect.promise(() => reloadApp());
}, Effect.scoped);

export const restoreDatabaseFromPickedBackup = Effect.fn('restoreDatabaseFromPickedBackup')(function* () {
    const result = yield* Effect.promise(() =>
        DocumentPicker.getDocumentAsync({
            type: ['application/x-sqlite3', 'application/zip', 'application/octet-stream', '*/*'],
            copyToCacheDirectory: true
        })
    );
    const uri = result.assets?.at(0)?.uri;

    if (result.canceled || !isNotEmptyString(uri)) {
        return;
    }

    yield* restoreFromUri(uri);
});
