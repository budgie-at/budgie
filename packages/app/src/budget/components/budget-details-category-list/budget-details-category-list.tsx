import { getBudgetCategorySpent } from '../../utils/get-budget-category-spent.util';
import { BudgetDetailsCategoryRow } from '../budget-details-category-row/budget-details-category-row';
import { BudgetDetailsOtherCategoryRow } from '../budget-details-other-category-row/budget-details-other-category-row';

import type { BudgetCategorySpentInterface, BudgetEffectiveCategoryLimitInterface } from '@budgie/budget';

interface Props {
    readonly categoryLimits: readonly BudgetEffectiveCategoryLimitInterface[];
    readonly spentByCategory: readonly BudgetCategorySpentInterface[];
    readonly spentOverall: number;
    readonly otherLimitAmount: number;
    readonly otherCarriedAmount: number;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
}

export const BudgetDetailsCategoryList = (props: Props) => {
    const { categoryLimits, spentByCategory, spentOverall, otherLimitAmount, otherCarriedAmount, periodStart, periodEnd, currencySymbol } =
        props;
    const spentByCategoryMap = new Map(spentByCategory.map(entry => [entry.categoryId, entry.spent]));

    const categoryIds = categoryLimits.map(limit => limit.categoryId);
    const limitedCategorySpent = categoryLimits.reduce(
        (total, limit) => total + getBudgetCategorySpent(spentByCategoryMap, limit.categoryId),
        0
    );
    const otherSpent = Math.max(0, spentOverall - limitedCategorySpent);

    const categoryLimitCards = categoryLimits.map(limit => {
        const spent = getBudgetCategorySpent(spentByCategoryMap, limit.categoryId);

        return (
            <BudgetDetailsCategoryRow
                key={limit.categoryId}
                categoryId={limit.categoryId}
                limitAmount={limit.limitAmount}
                carriedAmount={limit.carriedAmount}
                spent={spent}
                periodStart={periodStart}
                periodEnd={periodEnd}
                currencySymbol={currencySymbol}
            />
        );
    });

    return (
        <>
            {categoryLimitCards}
            <BudgetDetailsOtherCategoryRow
                categoryIds={categoryIds}
                spent={otherSpent}
                limitAmount={otherLimitAmount}
                carriedAmount={otherCarriedAmount}
                periodStart={periodStart}
                periodEnd={periodEnd}
                currencySymbol={currencySymbol}
            />
        </>
    );
};
