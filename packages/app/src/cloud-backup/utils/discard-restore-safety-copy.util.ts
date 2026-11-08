import { File } from 'expo-file-system';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { deleteIfExists } from '../../@generic/utils/delete-if-exists.util';
import { RESTORE_SAFETY_FILES } from '../constant/restore-safety-files.constant';

export const discardRestoreSafetyCopy = (): void => {
    Object.values(RESTORE_SAFETY_FILES).forEach(name => {
        deleteIfExists(new File(DATABASE_DIRECTORY, name));
    });
};
