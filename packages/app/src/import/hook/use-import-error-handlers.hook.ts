import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';

export const useImportErrorHandlers = (title: string) => {
    const { t } = useLingui();

    return {
        UnsupportedBackupError: () =>
            Effect.sync(() => void showErrorToast(title, t`This backup was made by an older Budgie version and cannot be imported.`)),
        BackupArchiveMissingDatabaseError: () =>
            Effect.sync(() => void showErrorToast(title, t`This backup archive does not contain a Budgie database.`)),
        InsufficientStorageError: () => Effect.sync(() => void showErrorToast(title, t`Not enough free storage to extract this backup.`))
    };
};
