import { isDefined } from '@rnw-community/shared';

export const getBudgetCategorySpent = (spentByCategoryMap: ReadonlyMap<number, number>, categoryId: number): number => {
    const spent = spentByCategoryMap.get(categoryId);

    return isDefined(spent) ? spent : 0;
};
