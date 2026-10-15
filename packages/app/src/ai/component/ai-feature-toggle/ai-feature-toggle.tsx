import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { AiFeaturesPageSelector } from '../../../app/(tabs)/settings/ai-features-page.selector';
import { SettingSwitch } from '../../../settings/components/setting-switch/setting-switch';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';

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
    const { settings } = useSettingsContext();

    const handleValueChange = (next: boolean) => {
        const features = {
            isAiVoiceInputEnabled: settings.isAiVoiceInputEnabled,
            isAiSuggestionsEnabled: settings.isAiSuggestionsEnabled,
            isAiTranslationsEnabled: settings.isAiTranslationsEnabled,
            [settingKey]: next
        };

        appRuntime.runFork(
            updateSettingsMutation({ ...features, isAiEnabled: Object.values(features).some(Boolean) }).pipe(
                Effect.tapCause(Effect.logError),
                Effect.catch(error => Effect.sync(() => void showErrorToast(t`Could not update AI feature`, getErrorMessage(error))))
            )
        );
    };

    const switchSlot = (
        <SettingSwitch
            value={settings[settingKey]}
            onValueChange={handleValueChange}
            testID={AiFeaturesPageSelector.FeatureSwitch(settingKey)}
            stateOnTestID={AiFeaturesPageSelector.FeatureSwitchStateOn(settingKey)}
            stateOffTestID={AiFeaturesPageSelector.FeatureSwitchStateOff(settingKey)}
        />
    );

    return <SettingsCard title={title} description={description} icon={icon} variant="positive" right={switchSlot} />;
};
