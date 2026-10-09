import * as Effect from 'effect/Effect';
import { Directory, File, FileMode, Paths } from 'expo-file-system';
import { unzip } from 'react-native-zip-archive';

import { isDefined } from '@rnw-community/shared';

import { toNativePath } from '../../utils/to-native-path.util';
import { UnsupportedBackupError } from '../error/unsupported-backup.error';

const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];
const DATABASE_EXTENSION = '.db';

const isZipFile = Effect.fn('resolveBackupFile.isZipFile')(function* (sourceUri: string) {
    const signature = yield* Effect.acquireUseRelease(
        Effect.sync(() => new File(sourceUri).open(FileMode.ReadOnly)),
        handle => Effect.promise(() => handle.readBytes(ZIP_SIGNATURE.length)),
        handle =>
            Effect.sync(() => {
                handle.close();
            })
    );

    return ZIP_SIGNATURE.every((byte, index) => signature[index] === byte);
});

export const resolveBackupFile = Effect.fn('resolveBackupFile')(function* (sourceUri: string) {
    if (!(yield* isZipFile(sourceUri))) {
        return sourceUri;
    }

    const extractDirectory = yield* Effect.acquireRelease(
        Effect.sync(() => {
            const directory = new Directory(Paths.cache, `backup-extract-${Date.now()}`);

            directory.create({ idempotent: true, intermediates: true });

            return directory;
        }),
        directory =>
            Effect.sync(() => {
                if (directory.exists) {
                    directory.delete();
                }
            })
    );

    yield* Effect.promise(() => unzip(toNativePath(sourceUri), toNativePath(extractDirectory.uri)));

    const databaseFile = extractDirectory
        .list()
        .find((entry): entry is File => entry instanceof File && entry.name.endsWith(DATABASE_EXTENSION));

    if (!isDefined(databaseFile)) {
        return yield* new UnsupportedBackupError();
    }

    return databaseFile.uri;
});
