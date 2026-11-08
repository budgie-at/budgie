import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsRowAccessory } from '../../../settings/components/settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { SettingsRowAccessoryKindEnum } from '../../../settings/enum/settings-row-accessory-kind.enum';
import { useRestoreBackup } from '../../hook/use-restore-backup.hook';

export const ImportDatabase = () => {
    const { t } = useLingui();
    const { selectAndRestore, isLoading } = useRestoreBackup();

    const handlePress = () => void selectAndRestore();

    return (
        <SettingsRow
            title={t`Restore from file`}
            subtitle={t`Replaces all Budgie data`}
            {...(!isLoading && { onPress: handlePress })}
            icon={UserIconNameEnum.DatabaseBackup}
            variant="ghost"
            right={<SettingsRowAccessory kind={SettingsRowAccessoryKindEnum.ACTION} isLoading={isLoading} />}
            testID={SettingsPageSelector.ImportDatabaseCard}
        />
    );
};
