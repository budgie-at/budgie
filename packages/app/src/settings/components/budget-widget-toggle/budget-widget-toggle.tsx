import { UserIconNameEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { BudgetSettingCard } from '../budget-setting-card/budget-setting-card';

const logger = getLogger('BudgetWidgetToggle');

export const BudgetWidgetToggle = () => {
    const { t } = useLingui();
    const isBudgetWidgetEnabled = useSetting('isBudgetWidgetEnabled');

    const handleChange = async (next: boolean) => {
        try {
            await updateSettingsMutation({ isBudgetWidgetEnabled: next });
        } catch (error: unknown) {
            logger.error('failed', { errorMessage: getErrorMessage(error) });
            Toast.show({ type: 'error', text1: t`Could not update widget setting`, text2: getErrorMessage(error) });
        }
    };

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
