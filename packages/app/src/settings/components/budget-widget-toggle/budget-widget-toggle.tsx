import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSettingToggle } from '../../hook/use-setting-toggle.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { SettingSwitch } from '../setting-switch/setting-switch';
import { SettingsCard } from '../settings-card/settings-card';

export const BudgetWidgetToggle = () => {
    const { t } = useLingui();
    const isBudgetWidgetEnabled = useSetting('isBudgetWidgetEnabled');
    const handleChange = useSettingToggle('isBudgetWidgetEnabled');

    return (
        <SettingsCard
            testID={SettingsPageSelector.BudgetWidgetCard}
            title={t`Show budget on home`}
            description={t`Display the budget card on the home screen`}
            icon={UserIconNameEnum.LayoutDashboard}
            variant="positive"
            right={
                <SettingSwitch
                    value={isBudgetWidgetEnabled}
                    onValueChange={handleChange}
                    testID={SettingsPageSelector.BudgetWidgetSwitch}
                    stateOnTestID={SettingsPageSelector.BudgetWidgetSwitchStateOn}
                    stateOffTestID={SettingsPageSelector.BudgetWidgetSwitchStateOff}
                />
            }
        />
    );
};
