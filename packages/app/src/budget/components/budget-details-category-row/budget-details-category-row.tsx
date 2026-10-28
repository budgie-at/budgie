import { TransactionTypeEnum } from '@budgie/contracts';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetDetailsLimitCard } from '../budget-details-limit-card/budget-details-limit-card';
import { BudgetDetailsLimitHeading } from '../budget-details-limit-heading/budget-details-limit-heading';

interface Props {
    readonly categoryId: number;
    readonly limitAmount: number;
    readonly spent: number;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
    readonly carriedAmount: number;
}

export const BudgetDetailsCategoryRow = (props: Props) => {
    const { categoryId, limitAmount, spent, periodStart, periodEnd, currencySymbol, carriedAmount } = props;
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
            spent={spent}
            limitAmount={limitAmount}
            currencySymbol={currencySymbol}
            testID={BudgetSelector.DetailsCategoryRow(categoryId)}
            spentTestID={BudgetSelector.DetailsCategorySpentLabel(categoryId)}
            onPress={handlePress}
        >
            <BudgetDetailsLimitHeading title={title} icon={icon} carriedAmount={carriedAmount} currencySymbol={currencySymbol} />
        </BudgetDetailsLimitCard>
    );
};
