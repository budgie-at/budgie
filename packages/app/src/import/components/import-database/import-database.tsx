import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsActionRow } from '../../../settings/components/settings-action-row/settings-action-row';
import { useRestoreBackup } from '../../hook/use-restore-backup.hook';

export const ImportDatabase = () => {
    const { t } = useLingui();
    const { selectAndRestore, isLoading } = useRestoreBackup();

    const handlePress = () => void selectAndRestore();

    return (
        <SettingsActionRow
            title={t`Restore from file`}
            subtitle={t`Replaces all Budgie data`}
            onPress={handlePress}
            icon={UserIconNameEnum.DatabaseBackup}
            isLoading={isLoading}
            testID={SettingsPageSelector.ImportDatabaseCard}
        />
    );
};
