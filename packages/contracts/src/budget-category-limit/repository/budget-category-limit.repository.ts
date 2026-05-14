import { Log } from '@budgie/logger';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { BudgetCategoryLimitEntityTable } from '../table/budget-category-limit-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { BudgetCategoryLimitCreateEntityInterface } from '../entity/budget-category-limit-create-entity.interface';
import type { BudgetCategoryLimitEntityInterface } from '../entity/budget-category-limit-entity.interface';

export class BudgetCategoryLimitRepository {
    constructor(private db: DB) {}

    @Log(
        (inputs, tx) =>
            `enter budgetIds=${inputs.map(input => input.budgetId).join(',')} categoryIds=${inputs.map(input => input.categoryId).join(',')} hasTx=${String(isDefined(tx))}`,
        (result, inputs, tx) =>
            `done budgetIds=${inputs.map(input => input.budgetId).join(',')} categoryIds=${inputs.map(input => input.categoryId).join(',')} insertedIds=${result.map(row => row.id).join(',')} hasTx=${String(isDefined(tx))}`,
        (error, inputs, tx) =>
            `throw budgetIds=${inputs.map(input => input.budgetId).join(',')} categoryIds=${inputs.map(input => input.categoryId).join(',')} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async bulkCreate(inputs: BudgetCategoryLimitCreateEntityInterface[], tx?: DB): Promise<BudgetCategoryLimitEntityInterface[]> {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        return await (tx ?? this.db).insert(BudgetCategoryLimitEntityTable).values(inputs).returning();
    }

    @Log(
        (updates, tx) =>
            `enter ids=${updates.map(update => update.id).join(',')} limitAmounts=${updates.map(update => update.limitAmount).join(',')} hasTx=${String(isDefined(tx))}`,
        (result, updates, tx) =>
            `done ids=${updates.map(update => update.id).join(',')} limitAmounts=${updates.map(update => update.limitAmount).join(',')} updatedIds=${result.map(row => row.id).join(',')} hasTx=${String(isDefined(tx))}`,
        (error, updates, tx) =>
            `throw ids=${updates.map(update => update.id).join(',')} limitAmounts=${updates.map(update => update.limitAmount).join(',')} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async bulkUpdate(updates: { id: number; limitAmount: number }[], tx?: DB): Promise<BudgetCategoryLimitEntityInterface[]> {
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

    @Log(
        (ids, tx) => `enter ids=${ids.join(',')} hasTx=${String(isDefined(tx))}`,
        (_result, ids, tx) => `done ids=${ids.join(',')} hasTx=${String(isDefined(tx))}`,
        (error, ids, tx) => `throw ids=${ids.join(',')} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async bulkDelete(ids: number[], tx?: DB): Promise<void> {
        if (!isNotEmptyArray(ids)) {
            return;
        }

        await (tx ?? this.db)
            .update(BudgetCategoryLimitEntityTable)
            .set({ deletedAt: new Date() })
            .where(and(inArray(BudgetCategoryLimitEntityTable.id, ids), isNull(BudgetCategoryLimitEntityTable.deletedAt)));
    }

    @Log(
        (budgetId, tx) => `enter budgetId=${budgetId} hasTx=${String(isDefined(tx))}`,
        (result, budgetId, tx) => `done budgetId=${budgetId} ids=${result.map(row => row.id).join(',')} hasTx=${String(isDefined(tx))}`,
        (error, budgetId, tx) => `throw budgetId=${budgetId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
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
