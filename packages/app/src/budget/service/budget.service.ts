import { BudgetService } from '@budgie/budget';
import { transactionAsync } from '@budgie/contracts';

import { budgetCategoryLimitRepository, budgetRepository, db } from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';

import type { BudgetCreateInputInterface, BudgetUpdateInputInterface } from '@budgie/budget';
import type { BudgetEntityInterface, DB } from '@budgie/contracts';

class AppBudgetService extends BudgetService<DB, DB> {
    @InvalidateDatabaseLiveQuery()
    override async createBudget(input: BudgetCreateInputInterface): Promise<BudgetEntityInterface> {
        return super.createBudget(input);
    }

    @InvalidateDatabaseLiveQuery()
    override async updateBudget(id: number, input: BudgetUpdateInputInterface): Promise<BudgetEntityInterface> {
        return super.updateBudget(id, input);
    }

    @InvalidateDatabaseLiveQuery()
    override async deleteBudget(id: number): Promise<void> {
        return super.deleteBudget(id);
    }
}

export const budgetService = new AppBudgetService(db, budgetRepository, budgetCategoryLimitRepository, transactionAsync);
