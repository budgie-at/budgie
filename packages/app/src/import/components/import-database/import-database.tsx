import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { UnsupportedBackupError } from '../../../@generic/drizzle/error/unsupported-backup.error';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useImportBackupPinModal } from '../../context/import-backup-pin-modal.context';
import { DatabaseImportService } from '../../service/database-import.service';

export const ImportDatabase = () => {
    const { t } = useLingui();
    const [openImportBackupPin] = useImportBackupPinModal();
    const [isLoading, setIsLoading] = useState(false);

    // eslint-disable-next-line max-statements -- Import orchestration handler with file picker, backup probe, confirmation and PIN prompt
    const handleSelectAndConfirm = async () => {
        setIsLoading(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/x-sqlite3', 'application/octet-stream', '*/*'],
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

            const backupPin = isBackupUnencrypted ? null : await openImportBackupPin(uri);

            if (!isBackupUnencrypted && !isNotEmptyString(backupPin)) {
                return;
            }

            setIsLoading(true);
            await appRuntime.runPromise(
                Effect.flatMap(DatabaseImportService, databaseImportService => databaseImportService.importFromUri(uri, backupPin))
            );
        } catch (error) {
            const errorMessage =
                error instanceof UnsupportedBackupError
                    ? t`This backup was made by an older Budgie version and cannot be imported.`
                    : getErrorMessage(error);

            Toast.show({ type: 'error', text1: t`Could not select database backup`, text2: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsCard
            title={t`Import Database`}
            description={t`Restore from a backup file`}
            onPress={handleSelectAndConfirm}
            icon={UserIconNameEnum.Database}
            variant="ghost"
            isLoading={isLoading}
            testID={SettingsPageSelector.ImportDatabaseCard}
        />
    );
};
