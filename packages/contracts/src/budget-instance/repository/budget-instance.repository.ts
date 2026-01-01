import { and, eq, gte, lte } from 'drizzle-orm';

import { TX } from '../../@generic/type/db.type';
import * as schema from '../../schema';
import { BudgetInstanceCreateEntityInterface } from '../entity/budget-instance-create-entity.interface';
import { BudgetInstanceUpdateEntityInterface } from '../entity/budget-instance-update-entity.interface';
import { BudgetInstanceStatusEnum } from '../enum/budget-instance-status.enum';
import { BudgetInstanceEntityTable } from '../table/budget-instance-entity.table';

import type { BudgetInstanceEntityInterface } from '../entity/budget-instance-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class BudgetInstanceRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findByBudgetId(budgetId: number) {
        return this.db.query.BudgetInstanceEntityTable.findMany({
            where: eq(BudgetInstanceEntityTable.budgetId, budgetId),
            orderBy: (table, { desc }) => [desc(table.startDate)]
        });
    }

    findCurrentByBudgetId(budgetId: number) {
        const now = new Date();

        return this.db.query.BudgetInstanceEntityTable.findFirst({
            where: and(
                eq(BudgetInstanceEntityTable.budgetId, budgetId),
                lte(BudgetInstanceEntityTable.startDate, now),
                gte(BudgetInstanceEntityTable.endDate, now)
            )
        });
    }

    findOpenByBudgetId(budgetId: number) {
        return this.db.query.BudgetInstanceEntityTable.findMany({
            where: and(
                eq(BudgetInstanceEntityTable.budgetId, budgetId),
                eq(BudgetInstanceEntityTable.status, BudgetInstanceStatusEnum.OPEN)
            )
        });
    }

    findById(id: number) {
        return this.db.query.BudgetInstanceEntityTable.findFirst({
            where: eq(BudgetInstanceEntityTable.id, id)
        });
    }

    findByIdWithRelations(id: number) {
        return this.db.query.BudgetInstanceEntityTable.findFirst({
            where: eq(BudgetInstanceEntityTable.id, id),
            with: {
                budget: {
                    with: {
                        instrument: true
                    }
                },
                allocationInstances: {
                    with: {
                        category: true,
                        budgetAllocation: true
                    }
                }
            }
        });
    }

    async create(input: BudgetInstanceCreateEntityInterface, tx?: TX): Promise<BudgetInstanceEntityInterface> {
        const [instance] = await (tx ?? this.db).insert(BudgetInstanceEntityTable).values(input).returning();

        return instance;
    }

    async updateById(id: number, input: BudgetInstanceUpdateEntityInterface): Promise<BudgetInstanceEntityInterface> {
        const [instance] = await this.db
            .update(BudgetInstanceEntityTable)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(BudgetInstanceEntityTable.id, id))
            .returning();

        return instance;
    }

    async close(id: number): Promise<BudgetInstanceEntityInterface> {
        return this.updateById(id, { status: BudgetInstanceStatusEnum.CLOSED });
    }

    async deleteById(id: number): Promise<void> {
        await this.db.delete(BudgetInstanceEntityTable).where(eq(BudgetInstanceEntityTable.id, id));
    }
}

