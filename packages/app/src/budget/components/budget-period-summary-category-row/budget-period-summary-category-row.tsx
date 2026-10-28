import { isDefined } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetDetailsLimitCard } from '../budget-details-limit-card/budget-details-limit-card';

interface Props {
    readonly categoryId: number;
    readonly limitAmount: number;
    readonly spent: number;
    readonly currencySymbol: string;
}

export const BudgetPeriodSummaryCategoryRow = ({ categoryId, limitAmount, spent, currencySymbol }: Props) => {
    const { category } = useGetCategoryByIdQuery(categoryId);

    return (
        <BudgetDetailsLimitCard
            title={isDefined(category) ? category.title : ''}
            icon={isDefined(category) ? category.icon : null}
            spent={spent}
            limitAmount={limitAmount}
            currencySymbol={currencySymbol}
            testID={BudgetSelector.PeriodSummaryCategoryRow(categoryId)}
            spentTestID={BudgetSelector.PeriodSummaryCategorySpentLabel(categoryId)}
        />
    );
};
