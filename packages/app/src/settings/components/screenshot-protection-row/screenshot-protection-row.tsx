import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsDetailRow } from '../settings-detail-row/settings-detail-row';

export const ScreenshotProtectionRow = () => {
    const { t } = useLingui();
    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');

    const handleToggle = (value: boolean) => {
        appRuntime.runFork(logAndContinue(updateSettingsMutation({ isScreenshotProtectionEnabled: value })));
    };

    return (
        <SettingsDetailRow
            icon={UserIconNameEnum.EyeOff}
            variant="pink"
            title={t`Hide in screenshots`}
            description={t`Budgie stays blank in screenshots and screen recordings`}
            right={
                <ThemedSwitch
                    testID={SettingsPageSelector.ScreenshotProtectionSwitch}
                    accessibilityLabel={t`Hide in screenshots`}
                    onValueChange={handleToggle}
                    value={isScreenshotProtectionEnabled}
                />
            }
            testID={SettingsPageSelector.ScreenshotProtectionCard}
        />
    );
};
