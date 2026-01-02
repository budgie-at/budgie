import { eq } from 'drizzle-orm';

import { TX } from '../../@generic/type/db.type';
import * as schema from '../../schema';
import { BudgetAllocationCreateEntityInterface } from '../entity/budget-allocation-create-entity.interface';
import { BudgetAllocationUpdateEntityInterface } from '../entity/budget-allocation-update-entity.interface';
import { BudgetAllocationEntityTable } from '../table/budget-allocation-entity.table';

import type { BudgetAllocationEntityInterface } from '../entity/budget-allocation-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class BudgetAllocationRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findByBudgetId(budgetId: number) {
        return this.db.query.BudgetAllocationEntityTable.findMany({
            where: eq(BudgetAllocationEntityTable.budgetId, budgetId)
        });
    }

    findByBudgetIdWithCategory(budgetId: number) {
        return this.db.query.BudgetAllocationEntityTable.findMany({
            where: eq(BudgetAllocationEntityTable.budgetId, budgetId),
            with: {
                category: true
            }
        });
    }

    findById(id: number) {
        return this.db.query.BudgetAllocationEntityTable.findFirst({
            where: eq(BudgetAllocationEntityTable.id, id)
        });
    }

    async create(input: BudgetAllocationCreateEntityInterface, tx?: TX): Promise<BudgetAllocationEntityInterface> {
        const [allocation] = await (tx ?? this.db).insert(BudgetAllocationEntityTable).values(input).returning();

        return allocation;
    }

    async bulkCreate(inputs: BudgetAllocationCreateEntityInterface[], tx?: TX): Promise<BudgetAllocationEntityInterface[]> {
        return await (tx ?? this.db).insert(BudgetAllocationEntityTable).values(inputs).returning();
    }

    async updateById(id: number, input: BudgetAllocationUpdateEntityInterface): Promise<BudgetAllocationEntityInterface> {
        const [allocation] = await this.db
            .update(BudgetAllocationEntityTable)
            .set(input)
            .where(eq(BudgetAllocationEntityTable.id, id))
            .returning();

        return allocation;
    }

    async deleteById(id: number): Promise<void> {
        await this.db.delete(BudgetAllocationEntityTable).where(eq(BudgetAllocationEntityTable.id, id));
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(BudgetAllocationEntityTable);
    }
}
