import { BudgetEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetListItemWrapper } from '../../../budget/component/budget-list-item-wrapper/budget-list-item-wrapper';
import { useGetBudgetsQuery } from '../../../budget/query/use-get-budgets.query';

export default function BudgetsSettingsPage() {
    const { t } = useLingui();
    const { budgets, isLoading } = useGetBudgetsQuery();

    const handleGoBack = () => void goBackOrReplace('/settings');
    const handleCreateBudget = () => void router.push('/budget/create');

    if (isLoading) {
        return <EmptyScreen />;
    }

    return (
        <Page
            header={
                <PageHeader
                    title={t`Budgets`}
                    description={t`Manage your budgets`}
                    onGoBack={handleGoBack}
                    right={
                        <HapticPressable hitSlop={10} onPress={handleCreateBudget}>
                            <Icon icon={UserIconNameEnum.Plus} size={20} className="text-primary" />
                        </HapticPressable>
                    }
                />
            }
        >
            <View className="gap-3 py-4">
                {isNotEmptyArray(budgets) ? (
                    budgets.map((budget: BudgetEntityInterface) => <BudgetListItemWrapper key={budget.id} budget={budget} />)
                ) : (
                    <Card className="items-center py-8">
                        <Icon icon={UserIconNameEnum.Wallet} size={32} className="text-secondary-foreground mb-2" />

                        <Text className="text-sm text-secondary-foreground text-center">
                            <Trans>No budgets yet</Trans>
                        </Text>

                        <HapticPressable onPress={handleCreateBudget} className="mt-4">
                            <Text className="text-sm font-medium text-primary">
                                <Trans>Create your first budget</Trans>
                            </Text>
                        </HapticPressable>
                    </Card>
                )}
            </View>
        </Page>
    );
}
