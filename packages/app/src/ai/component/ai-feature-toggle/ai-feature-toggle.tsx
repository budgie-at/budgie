import { useLingui } from '@lingui/react/macro';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { AiFeaturesPageSelector } from '../../../app/(tabs)/settings/ai-features-page.selector';
import { SettingSwitch } from '../../../settings/components/setting-switch/setting-switch';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { updateAiFeatureMutation } from '../../../settings/mutation/update-settings.mutation';

import type { AiFeatureSettingsInterface } from '../../interface/ai-feature-settings.interface';
import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly settingKey: keyof AiFeatureSettingsInterface;
    readonly title: string;
    readonly description: string;
    readonly icon: UserIconNameEnum;
}

export const AiFeatureToggle = ({ settingKey, title, description, icon }: Props) => {
    const { t } = useLingui();
    const isFeatureEnabled = useSetting(settingKey);

    const handleValueChange = (next: boolean) => {
        appRuntime.runFork(logAndContinue(updateAiFeatureMutation(settingKey, next).pipe(toastOnFailure(t`Could not update AI feature`))));
    };

    const switchSlot = (
        <SettingSwitch
            value={isFeatureEnabled}
            onValueChange={handleValueChange}
            testID={AiFeaturesPageSelector.FeatureSwitch(settingKey)}
            stateOnTestID={AiFeaturesPageSelector.FeatureSwitchStateOn(settingKey)}
            stateOffTestID={AiFeaturesPageSelector.FeatureSwitchStateOff(settingKey)}
        />
    );

    return <SettingsCard title={title} description={description} icon={icon} variant="positive" right={switchSlot} />;
};
