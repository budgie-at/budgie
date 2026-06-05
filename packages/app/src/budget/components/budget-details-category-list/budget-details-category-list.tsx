import { BudgetSelector } from '../../budget.selector';
import { BudgetDetailsCategoryRow } from '../budget-details-category-row/budget-details-category-row';

import type { BudgetCategorySpentInterface } from '../../interface/budget-category-spent.interface';
import type { BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

interface Props {
    readonly categoryLimits: readonly BudgetCategoryLimitEntityInterface[];
    readonly spentByCategory: readonly BudgetCategorySpentInterface[];
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
}

export const BudgetDetailsCategoryList = ({ categoryLimits, spentByCategory, periodStart, periodEnd, currencySymbol }: Props) => {
    const spentByCategoryMap = new Map(spentByCategory.map(entry => [entry.categoryId, entry.spent]));

    return categoryLimits.map(limit => (
        <BudgetDetailsCategoryRow
            key={limit.id}
            categoryId={limit.categoryId}
            limitAmount={limit.limitAmount}
            spent={spentByCategoryMap.get(limit.categoryId) ?? 0}
            periodStart={periodStart}
            periodEnd={periodEnd}
            currencySymbol={currencySymbol}
            testID={BudgetSelector.DetailsCategoryRow(limit.categoryId)}
            spentTestID={BudgetSelector.DetailsCategorySpentLabel(limit.categoryId)}
        />
    ));
};
