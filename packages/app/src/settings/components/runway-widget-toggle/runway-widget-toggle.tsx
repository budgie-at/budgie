import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSetting } from '../../hook/use-setting.hook';
import { useWidgetSettingToggle } from '../../hook/use-widget-setting-toggle.hook';
import { BudgetSettingCard } from '../budget-setting-card/budget-setting-card';

export const RunwayWidgetToggle = () => {
    const { t } = useLingui();
    const isRunwayWidgetEnabled = useSetting('isRunwayWidgetEnabled');
    const handleChange = useWidgetSettingToggle('isRunwayWidgetEnabled');

    return (
        <BudgetSettingCard
            testID={SettingsPageSelector.RunwayWidgetCard}
            title={t`Show runway on home`}
            description={t`Display the runway card on the home screen`}
            icon={UserIconNameEnum.TrendingDown}
            value={isRunwayWidgetEnabled}
            variant="positive"
            onValueChange={handleChange}
            switchTestID={SettingsPageSelector.RunwayWidgetSwitch}
            stateOnTestID={SettingsPageSelector.RunwayWidgetSwitchStateOn}
            stateOffTestID={SettingsPageSelector.RunwayWidgetSwitchStateOff}
        />
    );
};
