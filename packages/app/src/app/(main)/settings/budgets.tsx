import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetSettingsCard } from '../../../budget/component/budget-settings-card/budget-settings-card';
import { useGetBudgetsQuery } from '../../../budget/query/use-get-budgets.query';

export default function BudgetsSettingsPage() {
    const { t } = useLingui();
    const { budgets } = useGetBudgetsQuery();

    const handleGoBack = () => void goBackOrReplace('/settings');
    const handleCreateBudget = () => void router.push('/budget/create');

    return (
        <Page header={<PageHeader onGoBack={handleGoBack} title={t`Manage Budgets`} />}>
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="py-4 gap-4">
                    <Text className="text-sm text-secondary-foreground">
                        <Trans>Create budgets to plan your spending for current or future periods.</Trans>
                    </Text>

                    {isNotEmptyArray(budgets) ? (
                        <View className="gap-3">
                            {budgets.map(budget => (
                                <BudgetSettingsCard key={budget.id} budget={budget} />
                            ))}
                        </View>
                    ) : (
                        <View className="items-center py-8">
                            <Text className="text-sm text-secondary-foreground mb-4">
                                <Trans>No budgets created yet</Trans>
                            </Text>
                        </View>
                    )}

                    <Button variant="primary" content={t`Create New Budget`} onPress={handleCreateBudget} />
                </View>
            </ScrollView>
        </Page>
    );
}

