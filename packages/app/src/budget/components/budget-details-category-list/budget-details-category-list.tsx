import { BudgetSelector } from '../../budget.selector';
import { BudgetDetailsCategoryRow } from '../budget-details-category-row/budget-details-category-row';
import { BudgetDetailsOtherCategoryRow } from '../budget-details-other-category-row/budget-details-other-category-row';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
}

export const BudgetDetailsCategoryList = ({ projection, periodStart, periodEnd, currencySymbol }: Props) => {
    const categoryIds = projection.categories.map(category => category.categoryId);

    const categoryLimitCards = projection.categories.map(category => (
        <BudgetDetailsCategoryRow
            key={category.categoryId}
            categoryId={category.categoryId}
            scope={category}
            periodStart={periodStart}
            periodEnd={periodEnd}
            currencySymbol={currencySymbol}
            testID={BudgetSelector.DetailsCategoryRow(category.categoryId)}
            spentTestID={BudgetSelector.DetailsCategorySpentLabel(category.categoryId)}
        />
    ));

    return (
        <>
            {categoryLimitCards}
            <BudgetDetailsOtherCategoryRow
                categoryIds={categoryIds}
                scope={projection.other}
                periodStart={periodStart}
                periodEnd={periodEnd}
                currencySymbol={currencySymbol}
            />
        </>
    );
};
