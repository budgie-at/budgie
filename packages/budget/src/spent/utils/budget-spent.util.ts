import { isDefined } from '@rnw-community/shared';

import type { BudgetCategorySpentInterface } from '../interface/budget-category-spent.interface';
import type { BudgetSpentEntryInterface } from '../interface/budget-spent-entry.interface';
import type { BudgetSpentInterface } from '../interface/budget-spent.interface';

export const convertEntryAmount = (entry: BudgetSpentEntryInterface, baseInstrumentId: number): number => {
    const rate = entry.instrumentId === baseInstrumentId ? 1 : entry.rate;

    if (!isDefined(rate)) {
        return entry.amount;
    }

    return Math.round(entry.amount * rate);
};

export const computeSpent = (entries: readonly BudgetSpentEntryInterface[], baseInstrumentId: number): BudgetSpentInterface => {
    let spentOverall = 0;
    const categoryTotals = new Map<number, number>();

    for (const entry of entries) {
        const convertedAmount = convertEntryAmount(entry, baseInstrumentId);
        spentOverall += convertedAmount;

        if (isDefined(entry.categoryId)) {
            categoryTotals.set(entry.categoryId, (categoryTotals.get(entry.categoryId) ?? 0) + convertedAmount);
        }
    }

    const spentByCategory: readonly BudgetCategorySpentInterface[] = [...categoryTotals.entries()].map(([categoryId, spent]) => ({
        categoryId,
        spent
    }));

    return { spentOverall, spentByCategory };
};
