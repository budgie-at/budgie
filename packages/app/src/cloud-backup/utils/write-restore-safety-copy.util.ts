import * as Effect from 'effect/Effect';
import { File } from 'expo-file-system';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { DATABASE_LOCATION } from '../../@generic/drizzle/constant/database-location.constant';
import { DatabaseRekeyService } from '../../@generic/drizzle/service/database-rekey.service';
import { deleteIfExists } from '../../@generic/utils/delete-if-exists.util';
import { RESTORE_SAFETY_FILES } from '../constant/restore-safety-files.constant';

export const writeRestoreSafetyCopy = Effect.fnUntraced(function* (key: string | null) {
    const rekey = yield* DatabaseRekeyService;
    const partial = new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.partial);
    const copy = new File(DATABASE_DIRECTORY, RESTORE_SAFETY_FILES.copy);
    deleteIfExists(partial);
    yield* rekey.exportEncryptedCopy(`${DATABASE_LOCATION}/${RESTORE_SAFETY_FILES.partial}`, key);
    deleteIfExists(copy);
    partial.moveSync(copy);
});
