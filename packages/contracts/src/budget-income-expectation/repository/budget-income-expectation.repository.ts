import { eq } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DB, TX } from '../../@generic/type/db.type';
import { BudgetIncomeExpectationEntityInterface } from '../entity/budget-income-expectation-entity.interface';
import { BudgetIncomeExpectationCreateInputInterface } from '../input/budget-income-expectation-create-input.interface';
import { BudgetIncomeExpectationEntityTable } from '../table/budget-income-expectation-entity.table';

export class BudgetIncomeExpectationRepository {
    constructor(private db: DB) {}

    async getByBudgetId(budgetId: number): Promise<BudgetIncomeExpectationEntityInterface[]> {
        return this.db.query.BudgetIncomeExpectationEntityTable.findMany({
            where: eq(BudgetIncomeExpectationEntityTable.budgetId, budgetId),
            with: {
                category: true
            }
        });
    }

    async bulkCreate(
        budgetId: number,
        inputs: BudgetIncomeExpectationCreateInputInterface[],
        transaction?: TX
    ): Promise<BudgetIncomeExpectationEntityInterface[]> {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        const database = transaction ?? this.db;
        const values = inputs.map(input => ({ ...input, budgetId }));

        return database.insert(BudgetIncomeExpectationEntityTable).values(values).returning();
    }

    async deleteByBudgetId(budgetId: number, transaction?: TX): Promise<void> {
        const database = transaction ?? this.db;
        await database.delete(BudgetIncomeExpectationEntityTable).where(eq(BudgetIncomeExpectationEntityTable.budgetId, budgetId));
    }
}
