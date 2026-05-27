import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSettingsToggle } from '../../hook/use-settings-toggle.hook';
import { SettingSwitch } from '../setting-switch/setting-switch';
import { SettingsCard } from '../settings-card/settings-card';

export const BudgetWidgetToggle = () => {
    const { t } = useLingui();
    const { value, persist } = useSettingsToggle({
        settingKey: 'isBudgetWidgetEnabled',
        errorTitle: t`Could not update widget setting`
    });

    const switchSlot = (
        <SettingSwitch
            value={value}
            onValueChange={persist}
            testID={SettingsPageSelector.BudgetWidgetSwitch}
            stateOnTestID={SettingsPageSelector.BudgetWidgetSwitchStateOn}
            stateOffTestID={SettingsPageSelector.BudgetWidgetSwitchStateOff}
        />
    );

    return (
        <SettingsCard
            testID={SettingsPageSelector.BudgetWidgetCard}
            title={t`Show budget on home`}
            description={t`Display the budget card on the home screen`}
            icon={UserIconNameEnum.LayoutDashboard}
            variant="positive"
            right={switchSlot}
        />
    );
};
