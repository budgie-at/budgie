import { isDefined } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetDetailsLimitCard } from '../budget-details-limit-card/budget-details-limit-card';
import { BudgetDetailsLimitHeading } from '../budget-details-limit-heading/budget-details-limit-heading';

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
        <BudgetDetailsLimitCard
            spent={spent}
            limitAmount={limitAmount + carriedAmount}
            currencySymbol={currencySymbol}
            testID={BudgetSelector.PeriodSummaryCategoryRow(categoryId)}
            spentTestID={BudgetSelector.PeriodSummaryCategorySpentLabel(categoryId)}
        >
            <BudgetDetailsLimitHeading
                title={isDefined(category) ? category.title : ''}
                icon={isDefined(category) ? category.icon : null}
                carriedAmount={carriedAmount}
                currencySymbol={currencySymbol}
            />
        </BudgetDetailsLimitCard>
    );
};
