import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSettingToggle } from '../../hook/use-setting-toggle.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { SettingSwitch } from '../setting-switch/setting-switch';
import { SettingsCard } from '../settings-card/settings-card';

export const BudgetPushToggle = () => {
    const { t } = useLingui();
    const isBudgetPushEnabled = useSetting('isBudgetPushEnabled');

    const persist = useSettingToggle('isBudgetPushEnabled', t`Could not update notifications`);

    const handleChange = async (next: boolean) => {
        if (!next) {
            await persist(false);

            return;
        }

        const { status } = await Notifications.requestPermissionsAsync();

        if (status === Notifications.PermissionStatus.GRANTED) {
            await persist(true);
        } else {
            Toast.show({
                type: 'error',
                text1: t`Push notifications are disabled`,
                text2: t`Enable them in device settings to receive budget alerts.`
            });
        }
    };

    return (
        <SettingsCard
            testID={SettingsPageSelector.BudgetPushCard}
            title={t`Budget alerts`}
            description={t`Get notified when a budget threshold is crossed`}
            icon={UserIconNameEnum.Bell}
            variant="warning"
            right={
                <SettingSwitch
                    value={isBudgetPushEnabled}
                    onValueChange={handleChange}
                    testID={SettingsPageSelector.BudgetPushSwitch}
                    stateOnTestID={SettingsPageSelector.BudgetPushSwitchStateOn}
                    stateOffTestID={SettingsPageSelector.BudgetPushSwitchStateOff}
                />
            }
        />
    );
};
