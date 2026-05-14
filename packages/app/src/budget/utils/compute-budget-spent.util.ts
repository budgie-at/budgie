import { convertAmountToBase } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';

import { isDefined } from '@rnw-community/shared';

import type { BudgetCategorySpentInterface } from '../interface/budget-category-spent.interface';
import type { BudgetSpentInterface } from '../interface/budget-spent.interface';

const logger = getLogger('computeBudgetSpent');

interface SpentEntryRowInterface {
    readonly amount: number;
    readonly categoryId: number | null;
    readonly instrumentId: number;
    readonly rate: number | null;
}

export const computeBudgetSpent = (entries: SpentEntryRowInterface[], baseInstrumentId: number): BudgetSpentInterface => {
    let spentOverall = 0;
    let fallbackCount = 0;
    const categoryTotals = new Map<number, number>();
    const warnedPairs = new Set<string>();

    for (const entry of entries) {
        const isBaseInstrument = entry.instrumentId === baseInstrumentId;
        const rate = isBaseInstrument ? 1 : entry.rate;

        if (!isBaseInstrument && !isDefined(rate)) {
            const pairKey = `${entry.instrumentId}-${baseInstrumentId}`;
            if (!warnedPairs.has(pairKey)) {
                logger.log('missing-rate', { fromInstrumentId: entry.instrumentId, toInstrumentId: baseInstrumentId });
                warnedPairs.add(pairKey);
            }
            fallbackCount += 1;
        }

        const { convertedAmount } = convertAmountToBase(entry.amount, rate ?? null);
        spentOverall += convertedAmount;

        if (isDefined(entry.categoryId)) {
            categoryTotals.set(entry.categoryId, (categoryTotals.get(entry.categoryId) ?? 0) + convertedAmount);
        }
    }

    const spentByCategory: readonly BudgetCategorySpentInterface[] = [...categoryTotals.entries()].map(([categoryId, spent]) => ({
        categoryId,
        spent
    }));

    return { spentOverall, spentByCategory, fallbackCount };
};
