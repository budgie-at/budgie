import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsCard } from '../settings-card/settings-card';

export const BudgetWidgetToggle = () => {
    const { t } = useLingui();
    const isWidgetEnabled = useSetting('isBudgetWidgetEnabled');

    const handleChange = async (next: boolean) => {
        await updateSettingsMutation({ isBudgetWidgetEnabled: next });
    };

    const stateMarkerTestID = isWidgetEnabled
        ? SettingsPageSelector.BudgetWidgetSwitchStateOn
        : SettingsPageSelector.BudgetWidgetSwitchStateOff;

    const switchSlot = (
        <View className="flex-row items-center gap-x-xs">
            <View testID={stateMarkerTestID} className="h-1 w-1" />
            <ThemedSwitch testID={SettingsPageSelector.BudgetWidgetSwitch} value={isWidgetEnabled} onValueChange={handleChange} />
        </View>
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
