import { isDefined } from '@rnw-community/shared';

import type { BudgetSpentLedgerEntryInterface } from '../../spent/interface/budget-spent-ledger-entry.interface';
import type { BudgetFundCoveredInterface } from '../interface/budget-fund-covered.interface';
import type { BudgetFundDrawInterface } from '../interface/budget-fund-draw.interface';

export const computeFundCovered = (
    entries: readonly Pick<BudgetSpentLedgerEntryInterface, 'entryId' | 'categoryId'>[],
    draws: readonly BudgetFundDrawInterface[],
    limitedCategoryIds: ReadonlySet<number>
): BudgetFundCoveredInterface => {
    const categoryByEntry = new Map(entries.map(entry => [entry.entryId, entry.categoryId]));
    const byCategory = new Map<number, number>();
    let other = 0;

    for (const draw of draws) {
        const categoryId = categoryByEntry.get(draw.entryId);

        if (isDefined(categoryId) && limitedCategoryIds.has(categoryId)) {
            byCategory.set(categoryId, (byCategory.get(categoryId) ?? 0) + draw.amount);
        } else if (categoryByEntry.has(draw.entryId)) {
            other += draw.amount;
        }
    }

    return { byCategory, other };
};
