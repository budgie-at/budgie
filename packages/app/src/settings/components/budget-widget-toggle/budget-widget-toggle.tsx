import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSettingToggle } from '../../hook/use-setting-toggle.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { SettingSwitch } from '../setting-switch/setting-switch';
import { SettingsRow } from '../settings-row/settings-row';

export const BudgetWidgetToggle = () => {
    const { t } = useLingui();
    const isBudgetWidgetEnabled = useSetting('isBudgetWidgetEnabled');
    const handleChange = useSettingToggle('isBudgetWidgetEnabled');

    return (
        <SettingsRow
            testID={SettingsPageSelector.BudgetWidgetCard}
            title={t`Show budget`}
            subtitle={t`Spending left below your balance`}
            icon={UserIconNameEnum.Gauge}
            variant="ghost"
            right={
                <SettingSwitch
                    value={isBudgetWidgetEnabled}
                    onValueChange={handleChange}
                    accessibilityLabel={t`Show budget on Home screen`}
                    testID={SettingsPageSelector.BudgetWidgetSwitch}
                    stateOnTestID={SettingsPageSelector.BudgetWidgetSwitchStateOn}
                    stateOffTestID={SettingsPageSelector.BudgetWidgetSwitchStateOff}
                />
            }
        />
    );
};
