import { isDefined } from '@rnw-community/shared';

import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetCategoryLimitDiffInterface } from '../interface/budget-category-limit-diff.interface';
import type { BudgetCategoryLimitSnapshotInterface } from '../interface/budget-category-limit-snapshot.interface';

class BudgetCategoryLimitDiffService {
    diffCategoryLimits(
        existingLimits: readonly BudgetCategoryLimitSnapshotInterface[],
        nextLimits: readonly BudgetCategoryLimitInputInterface[]
    ): BudgetCategoryLimitDiffInterface {
        const existingByCategory = new Map(existingLimits.map(limit => [limit.categoryId, limit]));
        const nextCategoryIds = new Set(nextLimits.map(limit => limit.categoryId));

        const toCreate = nextLimits.filter(next => !existingByCategory.has(next.categoryId));
        const toUpdate = nextLimits
            .map(next => {
                const existing = existingByCategory.get(next.categoryId);

                return isDefined(existing) && existing.limitAmount !== next.limitAmount
                    ? { id: existing.id, limitAmount: next.limitAmount }
                    : null;
            })
            .filter(isDefined);
        const toDelete = existingLimits.filter(limit => !nextCategoryIds.has(limit.categoryId)).map(limit => limit.id);

        return { toCreate, toUpdate, toDelete };
    }
}

export const budgetCategoryLimitDiffService = new BudgetCategoryLimitDiffService();
