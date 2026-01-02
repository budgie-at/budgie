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

    async create(input: BudgetInstanceCreateEntityInterface, tx?: TX): Promise<BudgetInstanceEntityInterface> {
        const [instance] = await (tx ?? this.db).insert(BudgetInstanceEntityTable).values(input).returning();

        return instance;
    }

    async updateById(id: number, input: BudgetInstanceUpdateEntityInterface): Promise<BudgetInstanceEntityInterface> {
        const [instance] = await this.db
            .update(BudgetInstanceEntityTable)
            .set(input)
            .where(eq(BudgetInstanceEntityTable.id, id))
            .returning();

        return instance;
    }

    async close(id: number): Promise<BudgetInstanceEntityInterface> {
        return this.updateById(id, { status: BudgetInstanceStatusEnum.CLOSED });
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(BudgetInstanceEntityTable);
    }
}
