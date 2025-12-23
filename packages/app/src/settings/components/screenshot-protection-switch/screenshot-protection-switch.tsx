import { useLingui } from '@lingui/react/macro';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ThemedSwitch } from '../../../@generic/components/themed-switch/themed-switch';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useSettingsContext } from '../../context/settings.context';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const ScreenshotProtectionSwitch = () => {
    const { settings } = useSettingsContext();
    const { t } = useLingui();

    const toggleScreenshotProtection = async (checked: boolean) => {
        await updateSettingsMutation({ isScreenshotProtectionEnabled: checked });
    };

    return (
        <SettingsCard
            title={t`Screenshot Protection`}
            description={t`Hide account balances and net worth when taking screenshots`}
            right={<ThemedSwitch className="my-auto" onValueChange={toggleScreenshotProtection} value={settings.isScreenshotProtectionEnabled} />}
            left={<CircleIcon size="1_5xl" icon={ICONS.ShieldCheck} variant="pink" border={false} />}
        />
    );
};
