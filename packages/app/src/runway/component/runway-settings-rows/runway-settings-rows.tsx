import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { SettingSwitch } from '../../../settings/components/setting-switch/setting-switch';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useSettingToggle } from '../../../settings/hook/use-setting-toggle.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';

export const RunwaySettingsRows = () => {
    const { t } = useLingui();
    const isRunwayPillEnabled = useSetting('isRunwayPillEnabled');
    const isRunwayCryptoIncluded = useSetting('isRunwayCryptoIncluded');
    const handlePillChange = useSettingToggle('isRunwayPillEnabled');
    const handleCryptoChange = useSettingToggle('isRunwayCryptoIncluded');

    const handlePillPress = () => handlePillChange(!isRunwayPillEnabled);
    const handleCryptoPress = () => handleCryptoChange(!isRunwayCryptoIncluded);

    return (
        <>
            <SettingsRow
                testID={SettingsPageSelector.RunwayPillCard}
                onPress={handlePillPress}
                title={t`Show runway`}
                subtitle={t`Months left beside your balance`}
                icon={UserIconNameEnum.Hourglass}
                variant="ghost"
                right={
                    <SettingSwitch
                        value={isRunwayPillEnabled}
                        onValueChange={handlePillChange}
                        accessibilityLabel={t`Show runway on Home screen`}
                        testID={SettingsPageSelector.RunwayPillSwitch}
                        stateOnTestID={SettingsPageSelector.RunwayPillSwitchStateOn}
                        stateOffTestID={SettingsPageSelector.RunwayPillSwitchStateOff}
                    />
                }
            />
            <SettingsRow
                testID={SettingsPageSelector.RunwayCryptoCard}
                onPress={handleCryptoPress}
                title={t`Include crypto`}
                subtitle={t`In runway, at today's prices`}
                icon={UserIconNameEnum.Bitcoin}
                variant="ghost"
                right={
                    <SettingSwitch
                        value={isRunwayCryptoIncluded}
                        onValueChange={handleCryptoChange}
                        accessibilityLabel={t`Include crypto in runway`}
                        testID={SettingsPageSelector.RunwayCryptoSwitch}
                        stateOnTestID={SettingsPageSelector.RunwayCryptoSwitchStateOn}
                        stateOffTestID={SettingsPageSelector.RunwayCryptoSwitchStateOff}
                    />
                }
            />
        </>
    );
};
