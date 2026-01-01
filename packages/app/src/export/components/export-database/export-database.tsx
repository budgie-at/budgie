import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { databaseExportService } from '../../service/database-export.service';

export const ExportDatabase = () => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async () => {
        setIsLoading(true);
        try {
            await databaseExportService.exportAndShare();
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Export Failed`, text2: getErrorMessage(error) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsCard
            title={t`Export Database`}
            description={t`Create a backup of all your data`}
            onPress={handleExport}
            icon="Database"
            variant="default"
            isLoading={isLoading}
        />
    );
};
