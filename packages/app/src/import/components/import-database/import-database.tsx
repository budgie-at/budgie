import { useLingui } from '@lingui/react/macro';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useConfirmAction } from '../../../settings/hook/use-confirm-action.hook';
import { databaseImportService } from '../../service/database-import.service';

export const ImportDatabase = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUri, setSelectedUri] = useState<string | undefined>();

    const handleImport = async () => {
        if (!isNotEmptyString(selectedUri)) {
            return;
        }

        await databaseImportService.importFromUri(selectedUri);
    };

    const { ref, isLoading: isConfirmLoading, handleConfirm } = useConfirmAction(handleImport);

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

            setSelectedUri(uri);
            ref.current?.open();
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Error`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <SettingsCard
                title={t`Import Database`}
                description={t`Restore from a backup file`}
                onPress={handleSelectAndConfirm}
                icon="Database"
                variant="ghost"
                isLoading={isLoading}
            />

            <ConfirmActionBottomSheet
                ref={ref}
                isLoading={isConfirmLoading}
                variant="destructive"
                description={t`Importing a database will replace all current data. The app will restart after import. This action cannot be undone.`}
                buttonText={t`Import Database`}
                onSubmit={handleConfirm}
                icon="OctagonAlert"
                title={t`Import Database`}
            />
        </>
    );
};
