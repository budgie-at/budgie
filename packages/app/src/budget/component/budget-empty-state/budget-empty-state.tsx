import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';

export const BudgetEmptyState = () => {
    const navigateToCreateBudget = () => void router.push('/budget/create');

    return (
        <Card onPress={navigateToCreateBudget} className="items-center justify-center gap-3 py-8">
            <Icon icon="PiggyBank" size={32} className="text-secondary-foreground" />
            <View className="items-center">
                <Text className="text-sm font-medium text-primary">
                    <Trans>No budgets yet</Trans>
                </Text>
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Tap to create your first budget</Trans>
                </Text>
            </View>
        </Card>
    );
};
