import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useExportDatabaseAction } from '../../hook/use-export-database-action.hook';

export const ExportDatabase = () => {
    const { t } = useLingui();
    const { isLoading, handleExport } = useExportDatabaseAction();

    return (
        <SettingsCard
            title={t`Export Database`}
            description={t`Create a backup of all your data`}
            onPress={handleExport}
            icon={UserIconNameEnum.Database}
            variant="default"
            isLoading={isLoading}
            testID={SettingsPageSelector.ExportDatabaseCard}
        />
    );
};
