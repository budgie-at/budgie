import { BudgetCategoryLimitEntityTable } from '@budgie/contracts';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type {
    BudgetCategoryLimitBulkUpdateInputInterface,
    BudgetCategoryLimitCreateEntityInterface,
    BudgetCategoryLimitEntityInterface,
    DB
} from '@budgie/contracts';

export class BudgetCategoryLimitRepository {
    constructor(private db: DB) {}

    async bulkCreate(inputs: BudgetCategoryLimitCreateEntityInterface[], tx?: DB): Promise<BudgetCategoryLimitEntityInterface[]> {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        return await (tx ?? this.db).insert(BudgetCategoryLimitEntityTable).values(inputs).returning();
    }

    async bulkUpdate(updates: BudgetCategoryLimitBulkUpdateInputInterface[], tx?: DB): Promise<BudgetCategoryLimitEntityInterface[]> {
        if (!isNotEmptyArray(updates)) {
            return [];
        }

        const executor = tx ?? this.db;
        const rows = await Promise.all(
            updates.map(update =>
                executor
                    .update(BudgetCategoryLimitEntityTable)
                    .set({ limitAmount: update.limitAmount })
                    .where(eq(BudgetCategoryLimitEntityTable.id, update.id))
                    .returning()
            )
        );

        return rows.map(([row]) => row).filter(isDefined);
    }

    async bulkDelete(ids: number[], tx?: DB): Promise<void> {
        if (!isNotEmptyArray(ids)) {
            return;
        }

        await (tx ?? this.db)
            .update(BudgetCategoryLimitEntityTable)
            .set({ deletedAt: new Date() })
            .where(and(inArray(BudgetCategoryLimitEntityTable.id, ids), isNull(BudgetCategoryLimitEntityTable.deletedAt)));
    }

    async getByBudget(budgetId: number, tx?: DB): Promise<BudgetCategoryLimitEntityInterface[]> {
        return await (tx ?? this.db).query.BudgetCategoryLimitEntityTable.findMany({
            where: and(eq(BudgetCategoryLimitEntityTable.budgetId, budgetId), isNull(BudgetCategoryLimitEntityTable.deletedAt))
        });
    }

    findByBudget(budgetId: number) {
        return this.db.query.BudgetCategoryLimitEntityTable.findMany({
            where: and(eq(BudgetCategoryLimitEntityTable.budgetId, budgetId), isNull(BudgetCategoryLimitEntityTable.deletedAt))
        });
    }
}
