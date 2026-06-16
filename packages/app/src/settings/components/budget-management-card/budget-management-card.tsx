import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { SettingsCard } from '../settings-card/settings-card';

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

    return (
        <SettingsCard
            testID={SettingsPageSelector.BudgetManagementCard}
            onPress={handlePress}
            title={t`Manage budget`}
            description={t`Set a monthly limit and track spending`}
            icon={UserIconNameEnum.PiggyBank}
            variant="positive"
            isLoading={isBudgetLoading}
        />
    );
};
