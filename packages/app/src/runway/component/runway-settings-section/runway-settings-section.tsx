import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingSwitch } from '../../../settings/components/setting-switch/setting-switch';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useSettingToggle } from '../../../settings/hook/use-setting-toggle.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';

export const RunwaySettingsSection = () => {
    const { t } = useLingui();
    const isRunwayPillEnabled = useSetting('isRunwayPillEnabled');
    const isRunwayCryptoIncluded = useSetting('isRunwayCryptoIncluded');
    const handlePillChange = useSettingToggle('isRunwayPillEnabled');
    const handleCryptoChange = useSettingToggle('isRunwayCryptoIncluded');

    return (
        <>
            <SettingsCard
                testID={SettingsPageSelector.RunwayPillCard}
                title={t`Show on home`}
                description={t`Display the runway pill next to your total balance`}
                icon={UserIconNameEnum.TrendingUp}
                variant="positive"
                right={
                    <SettingSwitch
                        value={isRunwayPillEnabled}
                        onValueChange={handlePillChange}
                        testID={SettingsPageSelector.RunwayPillSwitch}
                        stateOnTestID={SettingsPageSelector.RunwayPillSwitchStateOn}
                        stateOffTestID={SettingsPageSelector.RunwayPillSwitchStateOff}
                    />
                }
            />
            <SettingsCard
                testID={SettingsPageSelector.RunwayCryptoCard}
                title={t`Include crypto`}
                description={t`Counts crypto at today's market value`}
                icon={UserIconNameEnum.Bitcoin}
                variant="warning"
                right={
                    <SettingSwitch
                        value={isRunwayCryptoIncluded}
                        onValueChange={handleCryptoChange}
                        testID={SettingsPageSelector.RunwayCryptoSwitch}
                        stateOnTestID={SettingsPageSelector.RunwayCryptoSwitchStateOn}
                        stateOffTestID={SettingsPageSelector.RunwayCryptoSwitchStateOff}
                    />
                }
            />
        </>
    );
};
