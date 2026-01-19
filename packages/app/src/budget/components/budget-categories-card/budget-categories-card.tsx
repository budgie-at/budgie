import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { BudgetCategoryStatusInterface } from '../../interface/budget-category-status.interface';
import { BudgetCategoryRow } from '../budget-category-row/budget-category-row';

interface Props {
    readonly categoryStatuses: readonly BudgetCategoryStatusInterface[];
}

export const BudgetCategoriesCard = ({ categoryStatuses }: Props) => {
    const router = useRouter();

    const sortedCategories = [...categoryStatuses].sort((categoryA, categoryB) => categoryB.percentage - categoryA.percentage);

    const handleAddCategory = () => void router.push('/budget/category-limits');

    return (
        <Card>
            <View className="flex-row items-center justify-between mb-md">
                <Text className="text-primary font-medium">
                    <Trans>Category Budgets</Trans>
                </Text>
                <HapticPressable onPress={handleAddCategory} className="p-sm">
                    <Icon icon={UserIconNameEnum.Plus} size={20} className="text-secondary-foreground" />
                </HapticPressable>
            </View>
            {isNotEmptyArray(sortedCategories) ? (
                <View className="gap-y-xl">
                    {sortedCategories.map(categoryStatus => (
                        <BudgetCategoryRow key={categoryStatus.category.id} categoryStatus={categoryStatus} />
                    ))}
                </View>
            ) : (
                <Text className="text-secondary-foreground text-center py-lg">
                    <Trans>No category budgets set. Track your overall spending limit above.</Trans>
                </Text>
            )}
        </Card>
    );
};
