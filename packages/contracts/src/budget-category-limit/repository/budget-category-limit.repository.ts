import { eq } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DB, TX } from '../../@generic/type/db.type';
import { BudgetCategoryLimitEntityInterface } from '../entity/budget-category-limit-entity.interface';
import { BudgetCategoryLimitCreateInputInterface } from '../input/budget-category-limit-create-input.interface';
import { BudgetCategoryLimitEntityTable } from '../table/budget-category-limit-entity.table';

export class BudgetCategoryLimitRepository {
    constructor(private db: DB) {}

    async getByBudgetId(budgetId: number): Promise<BudgetCategoryLimitEntityInterface[]> {
        return this.db.query.BudgetCategoryLimitEntityTable.findMany({
            where: eq(BudgetCategoryLimitEntityTable.budgetId, budgetId),
            with: {
                category: true
            }
        });
    }

    async bulkCreate(
        budgetId: number,
        inputs: BudgetCategoryLimitCreateInputInterface[],
        transaction?: TX
    ): Promise<BudgetCategoryLimitEntityInterface[]> {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        const database = transaction ?? this.db;
        const values = inputs.map(input => ({ ...input, budgetId }));

        return database.insert(BudgetCategoryLimitEntityTable).values(values).returning();
    }

    async deleteByBudgetId(budgetId: number, transaction?: TX): Promise<void> {
        const database = transaction ?? this.db;
        await database.delete(BudgetCategoryLimitEntityTable).where(eq(BudgetCategoryLimitEntityTable.budgetId, budgetId));
    }
}
