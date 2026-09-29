import { BudgetService } from '@budgie/budget';

import { budgetCategoryLimitRepository, budgetRepository } from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';

import type { BudgetCreateInputInterface, BudgetUpdateInputInterface } from '@budgie/budget';

const budgetDomainService = new BudgetService(budgetRepository, budgetCategoryLimitRepository);

class AppBudgetService {
    readonly createBudget = (input: BudgetCreateInputInterface) => invalidateDatabaseLiveQuery(budgetDomainService.createBudget(input));

    readonly updateBudget = (id: number, input: BudgetUpdateInputInterface) =>
        invalidateDatabaseLiveQuery(budgetDomainService.updateBudget(id, input));

    readonly deleteBudget = (id: number) => invalidateDatabaseLiveQuery(budgetDomainService.deleteBudget(id));
}

export const budgetService = new AppBudgetService();
