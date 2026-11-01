import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../settings-row/settings-row';

export const BudgetManagementCard = () => {
    const { t } = useLingui();
    const { budget, isLoading: isBudgetLoading } = useGetActiveBudgetQuery();

    const handlePress = () => {
        if (isDefined(budget)) {
            void router.push({ pathname: '/budget/edit', params: { id: String(budget.id) } });

            return;
        }

        void router.push('/budget/create');
    };

    const budgetValue = isDefined(budget) ? budget.name : t`Not set`;

    return (
        <SettingsRow
            onPress={handlePress}
            titleTestID={SettingsPageSelector.BudgetManagementCard}
            title={t`Active budget`}
            icon={UserIconNameEnum.PiggyBank}
            variant="ghost"
            right={<SettingsRowAccessory value={budgetValue} isLoading={isBudgetLoading} />}
        />
    );
};
