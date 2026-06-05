import { BudgetSelector } from '../../budget.selector';
import { BudgetDetailsCategoryRow } from '../budget-details-category-row/budget-details-category-row';
import { BudgetDetailsOtherCategoryRow } from '../budget-details-other-category-row/budget-details-other-category-row';

import type { BudgetCategorySpentInterface } from '../../interface/budget-category-spent.interface';
import type { BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

interface Props {
    readonly categoryLimits: readonly BudgetCategoryLimitEntityInterface[];
    readonly spentByCategory: readonly BudgetCategorySpentInterface[];
    readonly spentOverall: number;
    readonly overallLimit: number;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
}

export const BudgetDetailsCategoryList = (props: Props) => {
    const { categoryLimits, spentByCategory, spentOverall, overallLimit, periodStart, periodEnd, currencySymbol } = props;
    const spentByCategoryMap = new Map(spentByCategory.map(entry => [entry.categoryId, entry.spent]));
    const categoryIds = categoryLimits.map(limit => limit.categoryId);
    const limitedCategorySpent = categoryLimits.reduce((total, limit) => total + (spentByCategoryMap.get(limit.categoryId) ?? 0), 0);
    const limitedCategoryAmount = categoryLimits.reduce((total, limit) => total + limit.limitAmount, 0);
    const otherSpent = Math.max(0, spentOverall - limitedCategorySpent);
    const otherLimitAmount = Math.max(0, overallLimit - limitedCategoryAmount);

    const categoryLimitCards = categoryLimits.map(limit => (
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

    return (
        <>
            {categoryLimitCards}
            <BudgetDetailsOtherCategoryRow
                categoryIds={categoryIds}
                spent={otherSpent}
                limitAmount={otherLimitAmount}
                periodStart={periodStart}
                periodEnd={periodEnd}
                currencySymbol={currencySymbol}
            />
        </>
    );
};
