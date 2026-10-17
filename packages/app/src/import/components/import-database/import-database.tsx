import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useRestoreBackup } from '../../hook/use-restore-backup.hook';

export const ImportDatabase = () => {
    const { t } = useLingui();
    const { selectAndRestore, isLoading } = useRestoreBackup();

    return (
        <SettingsCard
            title={t`Import Database`}
            description={t`Restore from a backup file`}
            onPress={selectAndRestore}
            icon={UserIconNameEnum.Database}
            variant="ghost"
            isLoading={isLoading}
            testID={SettingsPageSelector.ImportDatabaseCard}
        />
    );
};
