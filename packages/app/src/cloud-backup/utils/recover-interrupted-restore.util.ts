import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import { File } from 'expo-file-system';

import { isDefined } from '@rnw-community/shared';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { DatabaseOpenError } from '../../@generic/drizzle/error/database-open.error';
import { deleteIfExists } from '../../@generic/utils/delete-if-exists.util';
import { RESTORE_SAFETY_COPY_LIFETIME_MILLISECONDS } from '../constant/restore-safety-copy-lifetime.constant';
import { RESTORE_SAFETY_FILES } from '../constant/restore-safety-files.constant';

import { discardRestoreSafetyCopy } from './discard-restore-safety-copy.util';

export const recoverInterruptedRestore = Effect.gen(function* () {
    const safetyCopy = yield* Effect.gen(function* () {
        const database = new File(DATABASE_DIRECTORY, DB_NAME);
        const safetyCopy = new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.copy);
        const recovering = new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.recovering);
        const pending = new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.pending);

        if (pending.exists) {
            if (!database.exists && safetyCopy.exists) {
                [recovering, new File(DATABASE_DIRECTORY, `${DB_NAME}-wal`), new File(DATABASE_DIRECTORY, `${DB_NAME}-shm`)].forEach(
                    deleteIfExists
                );
                yield* Effect.tryPromise({ try: () => safetyCopy.copy(recovering), catch: cause => DatabaseOpenError.make({ cause }) });
                yield* Effect.tryPromise({ try: () => recovering.move(database), catch: cause => DatabaseOpenError.make({ cause }) });
            }

            deleteIfExists(pending);
        }

        return safetyCopy;
    }).pipe(Effect.catchDefect(cause => Effect.fail(DatabaseOpenError.make({ cause }))));

    deleteIfExists(new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.source));
    deleteIfExists(new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.target));
    deleteIfExists(new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.partial));

    const { lastModified } = safetyCopy;

    const now = yield* Clock.currentTimeMillis;

    if (safetyCopy.exists && isDefined(lastModified) && now - lastModified > RESTORE_SAFETY_COPY_LIFETIME_MILLISECONDS) {
        discardRestoreSafetyCopy();
    }
});
