import * as Effect from 'effect/Effect';
import { Directory, File, FileMode, Paths } from 'expo-file-system';
import { listContents, unzip } from 'react-native-zip-archive';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

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

    const entries = yield* Effect.promise(() => listContents(toNativePath(sourceUri)));
    const databaseEntry = entries.find(entry => {
        const segments = entry.path.split('/');

        return (
            !entry.isDirectory &&
            entry.path.endsWith(DATABASE_EXTENSION) &&
            !segments.some(segment => segment === '..' || segment === '__MACOSX' || segment.startsWith('._'))
        );
    });
    const { availableDiskSpace } = Paths;

    if (!isDefined(databaseEntry)) {
        return yield* new UnsupportedBackupError();
    }

    const hasAmbiguousEntries =
        entries.filter(entry => entry.path === databaseEntry.path || entry.path.startsWith(`${databaseEntry.path}/`)).length > 1;

    if (hasAmbiguousEntries || (isPositiveNumber(availableDiskSpace) && databaseEntry.size > availableDiskSpace)) {
        return yield* new UnsupportedBackupError();
    }

    yield* Effect.promise(() => unzip(toNativePath(sourceUri), toNativePath(extractDirectory.uri), [databaseEntry.path]));

    return new File(extractDirectory, ...databaseEntry.path.split('/')).uri;
});
