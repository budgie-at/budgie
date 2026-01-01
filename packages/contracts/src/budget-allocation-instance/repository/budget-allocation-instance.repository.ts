import { eq } from 'drizzle-orm';

import { TX } from '../../@generic/type/db.type';
import * as schema from '../../schema';
import { BudgetAllocationInstanceCreateEntityInterface } from '../entity/budget-allocation-instance-create-entity.interface';
import { BudgetAllocationInstanceUpdateEntityInterface } from '../entity/budget-allocation-instance-update-entity.interface';
import { BudgetAllocationInstanceEntityTable } from '../table/budget-allocation-instance-entity.table';

import type { BudgetAllocationInstanceEntityInterface } from '../entity/budget-allocation-instance-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class BudgetAllocationInstanceRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findByBudgetInstanceId(budgetInstanceId: number) {
        return this.db.query.BudgetAllocationInstanceEntityTable.findMany({
            where: eq(BudgetAllocationInstanceEntityTable.budgetInstanceId, budgetInstanceId)
        });
    }

    findByBudgetInstanceIdWithRelations(budgetInstanceId: number) {
        return this.db.query.BudgetAllocationInstanceEntityTable.findMany({
            where: eq(BudgetAllocationInstanceEntityTable.budgetInstanceId, budgetInstanceId),
            with: {
                category: true,
                budgetAllocation: true
            }
        });
    }

    findById(id: number) {
        return this.db.query.BudgetAllocationInstanceEntityTable.findFirst({
            where: eq(BudgetAllocationInstanceEntityTable.id, id)
        });
    }

    async bulkCreate(
        inputs: BudgetAllocationInstanceCreateEntityInterface[],
        tx?: TX
    ): Promise<BudgetAllocationInstanceEntityInterface[]> {
        if (inputs.length === 0) {
            return [];
        }

        return await (tx ?? this.db).insert(BudgetAllocationInstanceEntityTable).values(inputs).returning();
    }

    async updateById(id: number, input: BudgetAllocationInstanceUpdateEntityInterface): Promise<BudgetAllocationInstanceEntityInterface> {
        const [instance] = await this.db
            .update(BudgetAllocationInstanceEntityTable)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(BudgetAllocationInstanceEntityTable.id, id))
            .returning();

        return instance;
    }

    async adjustAmount(id: number, adjustmentDelta: number): Promise<BudgetAllocationInstanceEntityInterface> {
        const current = await this.findById(id);
        if (!current) {
            throw new Error(`BudgetAllocationInstance with id ${id} not found`);
        }

        return this.updateById(id, { adjustment: current.adjustment + adjustmentDelta });
    }


    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(BudgetAllocationInstanceEntityTable);
    }
}

