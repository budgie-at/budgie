import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { BackupArchiveMissingDatabaseError } from '../../@generic/drizzle/error/backup-archive-missing-database.error';
import { InsufficientStorageError } from '../../@generic/drizzle/error/insufficient-storage.error';
import { UnsupportedBackupError } from '../../@generic/drizzle/error/unsupported-backup.error';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { useImportBackupPinModal } from '../context/import-backup-pin-modal.context';
import { DatabaseImportService } from '../service/database-import.service';

export const useRestoreBackup = () => {
    const { t } = useLingui();
    const [openImportBackupPin] = useImportBackupPinModal();
    const [isLoading, setIsLoading] = useState(false);

    const showImportError = (error: unknown) => {
        let errorMessage = getErrorMessage(error);

        if (error instanceof UnsupportedBackupError) {
            errorMessage = t`This backup was made by an older Budgie version and cannot be imported.`;
        } else if (error instanceof BackupArchiveMissingDatabaseError) {
            errorMessage = t`This backup archive does not contain a Budgie database.`;
        } else if (error instanceof InsufficientStorageError) {
            errorMessage = t`Not enough free storage to extract this backup.`;
        }
        Toast.show({ type: 'error', text1: t`Could not select database backup`, text2: errorMessage });
    };

    const importFromUri = async (uri: string, backupPin: string | null) => {
        setIsLoading(true);
        try {
            await appRuntime.runPromise(
                Effect.flatMap(DatabaseImportService, databaseImportService => databaseImportService.importFromUri(uri, backupPin))
            );
        } catch (error) {
            showImportError(error);
        } finally {
            setIsLoading(false);
        }
    };

    // eslint-disable-next-line max-statements -- Import orchestration handler with file picker, backup probe, confirmation and PIN prompt
    const handleSelectAndConfirm = async () => {
        setIsLoading(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/x-sqlite3', 'application/zip', 'application/octet-stream', '*/*'],
                copyToCacheDirectory: true
            });
            const { uri } = result.assets?.at(0) ?? {};

            if (result.canceled || !isNotEmptyString(uri)) {
                setIsLoading(false);

                return;
            }

            const isBackupUnencrypted = await appRuntime.runPromise(
                Effect.flatMap(DatabaseImportService, databaseImportService => databaseImportService.canOpenBackup(uri, null))
            );

            setIsLoading(false);

            const confirmMessage = isBackupUnencrypted
                ? t`Importing a database will replace all current data. The app will restart after import. This action cannot be undone.`
                : t`This backup is protected by a PIN. Importing it will replace all current data and its PIN becomes your app PIN. The app will restart after import. This action cannot be undone.`;
            const confirmed = await confirmAlert({
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
                await importFromUri(uri, null);

                return;
            }

            openImportBackupPin(uri, backupPin => {
                if (isNotEmptyString(backupPin)) {
                    void importFromUri(uri, backupPin);
                }
            });
        } catch (error) {
            showImportError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return { selectAndRestore: handleSelectAndConfirm, isLoading };
};
