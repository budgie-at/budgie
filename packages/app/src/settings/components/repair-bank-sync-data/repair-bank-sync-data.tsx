import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingsCard } from '../settings-card/settings-card';

const handlePress = () => void router.push('/settings/bank-sync-repairs');

export const RepairBankSyncData = () => {
    const { t } = useLingui();

    return (
        <SettingsCard
            onPress={handlePress}
            title={t`Repair Bank Sync Data`}
            description={t`Remove duplicate imported bank transactions`}
            icon={UserIconNameEnum.Wrench}
            variant="dark-warning"
            testID={SettingsPageSelector.RepairBankSyncDataCard}
        />
    );
};
