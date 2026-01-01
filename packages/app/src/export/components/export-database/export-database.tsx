import { useLingui } from '@lingui/react/macro';

import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useExportAction } from '../../hook/use-export-action.hook';
import { databaseExportService } from '../../service/database-export.service';

export const ExportDatabase = () => {
    const { t } = useLingui();
    const { isLoading, handleExport } = useExportAction(() => databaseExportService.exportAndShare());

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
