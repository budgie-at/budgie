import { isDefined } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetPeriodSummaryLimitRow } from '../budget-period-summary-limit-row/budget-period-summary-limit-row';

interface Props {
    readonly categoryId: number;
    readonly limitAmount: number;
    readonly carriedAmount: number;
    readonly spent: number;
    readonly currencySymbol: string;
}

export const BudgetPeriodSummaryCategoryRow = ({ categoryId, limitAmount, carriedAmount, spent, currencySymbol }: Props) => {
    const { category } = useGetCategoryByIdQuery(categoryId);

    return (
        <BudgetPeriodSummaryLimitRow
            title={isDefined(category) ? category.title : ''}
            carriedAmount={carriedAmount}
            spent={spent}
            limit={limitAmount + carriedAmount}
            currencySymbol={currencySymbol}
            testID={BudgetSelector.PeriodSummaryCategoryRow(categoryId)}
            spentTestID={BudgetSelector.PeriodSummaryCategorySpentLabel(categoryId)}
        />
    );
};
