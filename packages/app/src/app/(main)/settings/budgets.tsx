import { BudgetEntityInterface, BudgetStatusEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useGetBudgetsQuery } from '../../../budget/query/use-get-budgets.query';
import { budgetService } from '../../../budget/service/budget.service';

export default function BudgetsSettingsPage() {
    const { t } = useLingui();
    const { budgets, isLoading } = useGetBudgetsQuery();

    const handleGoBack = () => void goBackOrReplace('/settings');

    const handleActivate = async (budget: BudgetEntityInterface) => {
        try {
            await budgetService.activateBudget(budget.id);
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Error`,
                text2: t`Failed to activate budget`
            });
        }
    };

    const handleNavigateToBudget = (budget: BudgetEntityInterface) => void router.push(`/budget/${budget.id}`);
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
                            <Icon icon="Plus" size={20} className="text-primary" />
                        </HapticPressable>
                    }
                />
            }
        >
            <View className="gap-3 py-4">
                {isEmptyArray(budgets) ? (
                    <Card className="items-center py-8">
                        <Icon icon="Wallet" size={32} className="text-secondary-foreground mb-2" />
                        <Text className="text-sm text-secondary-foreground text-center">
                            <Trans>No budgets yet</Trans>
                        </Text>
                        <HapticPressable onPress={handleCreateBudget} className="mt-4">
                            <Text className="text-sm font-medium text-primary">
                                <Trans>Create your first budget</Trans>
                            </Text>
                        </HapticPressable>
                    </Card>
                ) : (
                    budgets.map((budget: BudgetEntityInterface) => {
                        const isActive = budget.status === BudgetStatusEnum.ACTIVE;
                        const handlePress = () => void handleNavigateToBudget(budget);
                        const handleActivatePress = () => void handleActivate(budget);

                        return (
                            <Card key={budget.id} className="gap-2">
                                <View className="flex-row items-center justify-between">
                                    <HapticPressable onPress={handlePress} className="flex-row items-center gap-3 flex-1">
                                        <Icon icon="Wallet" size={20} className="text-primary" />
                                        <View className="flex-1">
                                            <Text className="text-sm font-medium text-primary">{budget.title}</Text>
                                            <Text className="text-xs text-secondary-foreground">{isActive ? t`Active` : t`Inactive`}</Text>
                                        </View>
                                    </HapticPressable>

                                    {isActive ? (
                                        <View className="bg-positive-background px-2 py-1 rounded-lg">
                                            <Text className="text-xs font-medium text-positive-foreground">
                                                <Trans>Active</Trans>
                                            </Text>
                                        </View>
                                    ) : (
                                        <HapticPressable onPress={handleActivatePress} className="bg-primary px-3 py-1.5 rounded-lg">
                                            <Text className="text-xs font-medium text-primary-reverse">
                                                <Trans>Activate</Trans>
                                            </Text>
                                        </HapticPressable>
                                    )}
                                </View>

                                {isDefined(budget.createdAt) && (
                                    <Text className="text-xs text-secondary-foreground">
                                        <Trans>Created</Trans>: {budget.createdAt.toLocaleDateString()}
                                    </Text>
                                )}
                            </Card>
                        );
                    })
                )}
            </View>
        </Page>
    );
}
