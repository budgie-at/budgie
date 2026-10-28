import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';

import { isNotEmptyString } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useImportBackupPinModal } from '../context/import-backup-pin-modal.context';
import { DatabaseImportService } from '../service/database-import.service';

export const useRestoreBackup = () => {
    const { t } = useLingui();
    const [openImportBackupPin] = useImportBackupPinModal();
    const { isLoading, run } = useSingleFlight();

    const importErrorHandlers = {
        UnsupportedBackupError: () =>
            Effect.sync(
                () =>
                    void showErrorToast(
                        t`Could not select database backup`,
                        t`This backup was made by an older Budgie version and cannot be imported.`
                    )
            ),
        BackupArchiveMissingDatabaseError: () =>
            Effect.sync(
                () => void showErrorToast(t`Could not select database backup`, t`This backup archive does not contain a Budgie database.`)
            ),
        InsufficientStorageError: () =>
            Effect.sync(() => void showErrorToast(t`Could not select database backup`, t`Not enough free storage to extract this backup.`))
    };

    const importFromUri = (uri: string, backupPin: string | null) =>
        run(
            Effect.flatMap(DatabaseImportService, databaseImportService => databaseImportService.importFromUri(uri, backupPin)).pipe(
                Effect.catchTags(importErrorHandlers),
                toastOnFailure(t`Could not select database backup`)
            )
        );

    const handleSelectAndConfirm = () =>
        run(
            Effect.gen(function* () {
                const result = yield* Effect.promise(() =>
                    DocumentPicker.getDocumentAsync({
                        type: ['application/x-sqlite3', 'application/zip', 'application/octet-stream', '*/*'],
                        copyToCacheDirectory: true
                    })
                );
                const { uri } = result.assets?.at(0) ?? {};

                if (result.canceled || !isNotEmptyString(uri)) {
                    return;
                }

                const databaseImportService = yield* DatabaseImportService;
                const isBackupUnencrypted = yield* databaseImportService.canOpenBackup(uri, null);
                const confirmMessage = isBackupUnencrypted
                    ? t`Importing a database will replace all current data. The app will restart after import. This action cannot be undone.`
                    : t`This backup is protected by a PIN. Importing it will replace all current data and its PIN becomes your app PIN. The app will restart after import. This action cannot be undone.`;
                const confirmed = yield* confirmAlert({
                    title: t`Import Database`,
                    message: confirmMessage,
                    confirmText: t`Import Database`,
                    cancelText: t`Cancel`,
                    isDestructive: true
                });

                if (!confirmed) {
                    return;
                }

                if (isBackupUnencrypted) {
                    yield* databaseImportService.importFromUri(uri, null);

                    return;
                }

                openImportBackupPin(uri, backupPin => {
                    if (isNotEmptyString(backupPin)) {
                        void importFromUri(uri, backupPin);
                    }
                });
            }).pipe(Effect.catchTags(importErrorHandlers), toastOnFailure(t`Could not select database backup`))
        );

    return { selectAndRestore: handleSelectAndConfirm, isLoading };
};
