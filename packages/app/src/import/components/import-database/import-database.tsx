import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { SettingsPageSelectors } from '../../../@e2e/selectors/settings-page.selector';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { databaseImportService } from '../../service/database-import.service';

export const ImportDatabase = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

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

            setIsLoading(false);

            const confirmed = await confirmAlert({
                title: t`Import Database`,
                message: t`Importing a database will replace all current data. The app will restart after import. This action cannot be undone.`,
                confirmText: t`Import Database`,
                cancelText: t`Cancel`,
                isDestructive: true
            });

            if (!confirmed) {
                return;
            }

            setIsLoading(true);
            await databaseImportService.importFromUri(uri);
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Error`, text2: getErrorMessage(error) });
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
            testID={SettingsPageSelectors.ImportDatabaseCard}
        />
    );
};
