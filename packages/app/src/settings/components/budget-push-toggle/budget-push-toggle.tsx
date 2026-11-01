import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import Toast from 'react-native-toast-message';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingSwitch } from '../setting-switch/setting-switch';
import { SettingsRow } from '../settings-row/settings-row';

const handleOpenSettings = () => void Linking.openSettings();

export const BudgetPushToggle = () => {
    const { t } = useLingui();
    const isBudgetPushEnabled = useSetting('isBudgetPushEnabled');
    const { run } = useSingleFlight();

    const persist = (next: boolean) =>
        updateSettingsMutation({ isBudgetPushEnabled: next }).pipe(toastOnFailure(t`Could not update notifications`));

    const handleChange = (next: boolean) => {
        void run(
            Effect.gen(function* () {
                if (!next) {
                    yield* persist(false);

                    return;
                }

                const { status } = yield* Effect.promise(() => Notifications.requestPermissionsAsync());

                if (status === Notifications.PermissionStatus.GRANTED) {
                    yield* persist(true);
                } else {
                    Toast.show({
                        type: 'error',
                        text1: t`Push notifications are disabled`,
                        text2: t`Tap to open Settings and allow notifications.`,
                        onPress: handleOpenSettings
                    });
                }
            })
        );
    };

    return (
        <SettingsRow
            testID={SettingsPageSelector.BudgetPushCard}
            title={t`Budget alerts`}
            subtitle={t`Notify me near a limit`}
            icon={UserIconNameEnum.Bell}
            variant="ghost"
            right={
                <SettingSwitch
                    value={isBudgetPushEnabled}
                    onValueChange={handleChange}
                    accessibilityLabel={t`Budget alerts`}
                    testID={SettingsPageSelector.BudgetPushSwitch}
                    stateOnTestID={SettingsPageSelector.BudgetPushSwitchStateOn}
                    stateOffTestID={SettingsPageSelector.BudgetPushSwitchStateOff}
                />
            }
        />
    );
};
