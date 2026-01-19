import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { BudgetCategoryStatusInterface } from '../../interface/budget-category-status.interface';
import { BudgetCategoryRow } from '../budget-category-row/budget-category-row';

interface Props {
    readonly categoryStatuses: readonly BudgetCategoryStatusInterface[];
}

export const BudgetCategoriesCard = ({ categoryStatuses }: Props) => {
    const sortedCategories = [...categoryStatuses].sort((categoryA, categoryB) => categoryB.percentage - categoryA.percentage);

    return (
        <Card>
            <Text className="text-primary font-medium mb-md">
                <Trans>Category Budgets</Trans>
            </Text>
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
