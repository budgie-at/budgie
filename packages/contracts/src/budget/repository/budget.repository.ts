import { eq, ne } from 'drizzle-orm';

import { TX } from '../../@generic/type/db.type';
import * as schema from '../../schema';
import { BudgetCreateEntityInterface } from '../entity/budget-create-entity.interface';
import { BudgetStatusEnum } from '../enum/budget-status.enum';
import { BudgetEntityTable } from '../table/budget-entity.table';

import type { BudgetEntityInterface } from '../entity/budget-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class BudgetRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findAll() {
        return this.db.query.BudgetEntityTable.findMany();
    }

    findActive() {
        return this.db.query.BudgetEntityTable.findFirst({
            where: eq(BudgetEntityTable.status, BudgetStatusEnum.ACTIVE)
        });
    }

    findById(id: number) {
        return this.db.query.BudgetEntityTable.findFirst({
            where: eq(BudgetEntityTable.id, id)
        });
    }

    async create(input: BudgetCreateEntityInterface, tx?: TX): Promise<BudgetEntityInterface> {
        const [budget] = await (tx ?? this.db).insert(BudgetEntityTable).values(input).returning();

        return budget;
    }

    async deactivateAllExcept(budgetId: number, tx?: TX): Promise<void> {
        await (tx ?? this.db)
            .update(BudgetEntityTable)
            .set({ status: BudgetStatusEnum.DRAFT, updatedAt: new Date() })
            .where(ne(BudgetEntityTable.id, budgetId));
    }

    async activate(id: number, tx?: TX): Promise<BudgetEntityInterface> {
        await this.deactivateAllExcept(id, tx);

        const [budget] = await (tx ?? this.db)
            .update(BudgetEntityTable)
            .set({ status: BudgetStatusEnum.ACTIVE, updatedAt: new Date() })
            .where(eq(BudgetEntityTable.id, id))
            .returning();

        return budget;
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(BudgetEntityTable);
    }
}

