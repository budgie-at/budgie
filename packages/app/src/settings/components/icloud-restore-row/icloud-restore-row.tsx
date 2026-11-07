import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsRow } from '../settings-row/settings-row';

const handlePress = () => void router.push('/settings/icloud-backups');

export const ICloudRestoreRow = () => {
    const { t } = useLingui();

    return (
        <SettingsRow
            icon={UserIconNameEnum.CloudDownload}
            variant="ghost"
            title={t`Restore from iCloud`}
            subtitle={t`Pick a backup from any of your devices`}
            onPress={handlePress}
            testID={SettingsPageSelector.ICloudRestoreCard}
        />
    );
};
