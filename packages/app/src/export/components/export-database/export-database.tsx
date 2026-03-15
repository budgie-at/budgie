import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelectors } from '../../../@e2e/selectors/settings-page.selector';
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
            icon={UserIconNameEnum.Database}
            variant="default"
            isLoading={isLoading}
            testID={SettingsPageSelectors.ExportDatabaseCard}
        />
    );
};
