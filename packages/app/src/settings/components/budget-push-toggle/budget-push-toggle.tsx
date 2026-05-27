import { UserIconNameEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { useLingui } from '@lingui/react/macro';
import * as Notifications from 'expo-notifications';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

const logger = getLogger('BudgetPushToggle');

export const BudgetPushToggle = () => {
    const { t } = useLingui();
    const isPushEnabled = useSetting('isBudgetPushEnabled');

    const persist = async (next: boolean): Promise<void> => {
        try {
            await updateSettingsMutation({ isBudgetPushEnabled: next });
        } catch (error: unknown) {
            logger.error('toggle-failed', { errorMessage: getErrorMessage(error) });
            Toast.show({ type: 'error', text1: t`Could not update notifications`, text2: getErrorMessage(error) });
        }
    };

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

    const stateMarkerTestID = isPushEnabled ? SettingsPageSelector.BudgetPushSwitchStateOn : SettingsPageSelector.BudgetPushSwitchStateOff;

    const switchSlot = (
        <View className="flex-row items-center gap-x-xs">
            <View testID={stateMarkerTestID} className="h-1 w-1" />
            <ThemedSwitch testID={SettingsPageSelector.BudgetPushSwitch} value={isPushEnabled} onValueChange={handleChange} />
        </View>
    );

    return (
        <SettingsCard
            testID={SettingsPageSelector.BudgetPushCard}
            title={t`Budget alerts`}
            description={t`Get notified when a budget threshold is crossed`}
            icon={UserIconNameEnum.Bell}
            variant="warning"
            right={switchSlot}
        />
    );
};
