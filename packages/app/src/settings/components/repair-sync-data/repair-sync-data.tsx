import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsRow } from '../settings-row/settings-row';

const handlePress = () => void router.push('/settings/sync-repairs');

export const RepairSyncData = () => {
    const { t } = useLingui();

    return (
        <SettingsRow
            onPress={handlePress}
            title={t`Repair synced data`}
            subtitle={t`Remove duplicate bank imports`}
            icon={UserIconNameEnum.Wrench}
            variant="ghost"
            testID={SettingsPageSelector.RepairSyncDataCard}
        />
    );
};
