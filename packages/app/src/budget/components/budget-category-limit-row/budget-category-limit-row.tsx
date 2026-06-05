import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly categoryId: number;
    readonly limitAmount: number;
    readonly spent: number;
    readonly testID?: string;
    readonly spentTestID?: string;
}

export const BudgetCategoryLimitRow = ({ categoryId, limitAmount, spent, testID, spentTestID }: Props) => {
    const { category } = useGetCategoryByIdQuery(categoryId);
    const title = category?.title ?? '';

    return (
        <View testID={testID} collapsable={false} className="flex-row items-center gap-x-md">
            {isDefined(category) && <CircleIcon icon={category.icon} variant="ghost" size={32} iconSize={16} />}

            <View className="flex-1 gap-y-xs">
                <Text className="text-primary text-sm font-medium">{title}</Text>
                <BudgetProgressBar isAmountLight spent={spent} limit={limitAmount} spentTestID={spentTestID} />
            </View>
        </View>
    );
};
