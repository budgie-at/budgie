import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsRow } from '../settings-row/settings-row';

export const ScreenshotProtectionRow = () => {
    const { t } = useLingui();
    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');

    const handleToggle = (value: boolean) => {
        appRuntime.runFork(
            logAndContinue(
                updateSettingsMutation({ isScreenshotProtectionEnabled: value }).pipe(toastOnFailure(t`Could not update settings`))
            )
        );
    };

    const handlePress = () => void handleToggle(!isScreenshotProtectionEnabled);

    return (
        <SettingsRow
            icon={UserIconNameEnum.ScanEye}
            variant="ghost"
            title={t`Hide screen captures`}
            subtitle={t`Blank screenshots and recordings`}
            right={
                <ThemedSwitch
                    testID={SettingsPageSelector.ScreenshotProtectionSwitch}
                    accessibilityLabel={t`Hide screen captures`}
                    onValueChange={handleToggle}
                    value={isScreenshotProtectionEnabled}
                />
            }
            testID={SettingsPageSelector.ScreenshotProtectionCard}
            onPress={handlePress}
        />
    );
};
