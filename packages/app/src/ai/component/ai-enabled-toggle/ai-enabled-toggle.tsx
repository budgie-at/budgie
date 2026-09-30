import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingSwitch } from '../../../settings/components/setting-switch/setting-switch';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';

export const AiEnabledToggle = () => {
    const { t } = useLingui();
    const isAiEnabled = useSetting('isAiEnabled');

    const handleValueChange = (next: boolean) => {
        appRuntime.runFork(
            updateSettingsMutation({ isAiEnabled: next }).pipe(
                Effect.tapCause(Effect.logError),
                Effect.catch(error => Effect.sync(() => void showErrorToast(t`Could not update on-device AI`, getErrorMessage(error))))
            )
        );
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
