import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSetting } from '../../hook/use-setting.hook';
import { useWidgetSettingToggle } from '../../hook/use-widget-setting-toggle.hook';
import { BudgetSettingCard } from '../budget-setting-card/budget-setting-card';

export const BudgetWidgetToggle = () => {
    const { t } = useLingui();
    const isBudgetWidgetEnabled = useSetting('isBudgetWidgetEnabled');
    const handleChange = useWidgetSettingToggle('isBudgetWidgetEnabled');

    return (
        <BudgetSettingCard
            testID={SettingsPageSelector.BudgetWidgetCard}
            title={t`Show budget on home`}
            description={t`Display the budget card on the home screen`}
            icon={UserIconNameEnum.LayoutDashboard}
            value={isBudgetWidgetEnabled}
            variant="positive"
            onValueChange={handleChange}
            switchTestID={SettingsPageSelector.BudgetWidgetSwitch}
            stateOnTestID={SettingsPageSelector.BudgetWidgetSwitchStateOn}
            stateOffTestID={SettingsPageSelector.BudgetWidgetSwitchStateOff}
        />
    );
};
