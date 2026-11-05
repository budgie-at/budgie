import * as Effect from 'effect/Effect';
import { File } from 'expo-file-system';

import { isDefined } from '@rnw-community/shared';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { RESTORE_SAFETY_COPY_LIFETIME_MILLISECONDS } from '../constant/restore-safety-copy-lifetime.constant';
import { RESTORE_SAFETY_FILES } from '../constant/restore-safety-files.constant';

import { discardRestoreSafetyCopy } from './discard-restore-safety-copy.util';

const deleteIfExists = (file: File): void => {
    if (file.exists) {
        file.delete();
    }
};

export const recoverInterruptedRestore = Effect.gen(function* () {
    const database = new File(DATABASE_DIRECTORY, DB_NAME);
    const safetyCopy = new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.copy);
    const recovering = new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.recovering);
    const pending = new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.pending);

    if (pending.exists) {
        if (!database.exists && safetyCopy.exists) {
            deleteIfExists(recovering);
            deleteIfExists(new File(DATABASE_DIRECTORY, `${DB_NAME}-wal`));
            deleteIfExists(new File(DATABASE_DIRECTORY, `${DB_NAME}-shm`));
            yield* Effect.promise(() => safetyCopy.copy(recovering));
            yield* Effect.promise(() => recovering.move(database));
        }

        deleteIfExists(pending);
    }

    deleteIfExists(new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.source));
    deleteIfExists(new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.target));
    deleteIfExists(new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.partial));

    const { lastModified } = safetyCopy;

    if (safetyCopy.exists && isDefined(lastModified) && Date.now() - lastModified > RESTORE_SAFETY_COPY_LIFETIME_MILLISECONDS) {
        discardRestoreSafetyCopy();
    }
});
