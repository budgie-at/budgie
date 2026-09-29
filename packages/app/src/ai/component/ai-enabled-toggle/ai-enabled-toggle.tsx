import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingSwitch } from '../../../settings/components/setting-switch/setting-switch';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';

export const AiEnabledToggle = () => {
    const { t } = useLingui();
    const isAiEnabled = useSetting('isAiEnabled');

    const handleValueChange = (next: boolean) => {
        void appRuntime.runPromise(updateSettingsMutation({ isAiEnabled: next })).catch((error: unknown) => {
            appRuntime.runFork(Effect.logError('failed', { isAiEnabled: next, errorMessage: getErrorMessage(error) }));
            Toast.show({ type: 'error', text1: t`Could not update on-device AI`, text2: getErrorMessage(error) });
        });
    };

    const switchSlot = (
        <SettingSwitch
            value={isAiEnabled}
            onValueChange={handleValueChange}
            testID={SettingsPageSelector.AiEnabledSwitch}
            stateOnTestID={SettingsPageSelector.AiEnabledSwitchStateOn}
            stateOffTestID={SettingsPageSelector.AiEnabledSwitchStateOff}
        />
    );

    return (
        <SettingsCard
            testID={SettingsPageSelector.AiEnabledCard}
            title={t`On-device AI`}
            description={t`Categorises transactions, suggests tags and transcribes voice notes on this device. Downloads about 2.5 GB of models once — best on Wi-Fi.`}
            icon={UserIconNameEnum.Brain}
            variant="positive"
            right={switchSlot}
        />
    );
};
