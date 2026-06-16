import { TransactionTypeEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetDetailsLimitCard } from '../budget-details-limit-card/budget-details-limit-card';

interface Props {
    readonly categoryId: number;
    readonly limitAmount: number;
    readonly spent: number;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
    readonly testID: string;
    readonly spentTestID: string;
}

export const BudgetDetailsCategoryRow = (props: Props) => {
    const { categoryId, limitAmount, spent, periodStart, periodEnd, currencySymbol, testID, spentTestID } = props;
    const { category } = useGetCategoryByIdQuery(categoryId);
    const title = isDefined(category) ? category.title : '';
    const icon = isDefined(category) ? category.icon : null;

    const handlePress = () => {
        router.push({
            pathname: '/analytics/transactions',
            params: {
                type: TransactionTypeEnum.EXPENSE,
                categoryId: String(categoryId),
                startDate: periodStart.toISOString(),
                endDate: periodEnd.toISOString()
            }
        });
    };

    return (
        <BudgetDetailsLimitCard
            title={title}
            icon={icon}
            spent={spent}
            limitAmount={limitAmount}
            currencySymbol={currencySymbol}
            testID={testID}
            spentTestID={spentTestID}
            onPress={handlePress}
        />
    );
};
