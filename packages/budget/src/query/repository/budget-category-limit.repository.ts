import { BudgetCategoryLimitEntityTable, Db } from '@budgie/contracts';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { BudgetCategoryLimitBulkUpdateInputInterface, BudgetCategoryLimitCreateEntityInterface, DB } from '@budgie/contracts';

export class BudgetCategoryLimitRepository {
    readonly bulkCreate = Effect.fn('BudgetCategoryLimitRepository.bulkCreate')(function* (
        inputs: BudgetCategoryLimitCreateEntityInterface[]
    ) {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        return yield* Db.query(db => db.insert(BudgetCategoryLimitEntityTable).values(inputs).returning());
    });

    readonly bulkUpdate = Effect.fn('BudgetCategoryLimitRepository.bulkUpdate')(function* (
        updates: BudgetCategoryLimitBulkUpdateInputInterface[]
    ) {
        const rows = yield* Effect.forEach(updates, update =>
            Db.query(db =>
                db
                    .update(BudgetCategoryLimitEntityTable)
                    .set({ limitAmount: update.limitAmount })
                    .where(eq(BudgetCategoryLimitEntityTable.id, update.id))
                    .returning()
            )
        );

        return rows.map(([row]) => row).filter(isDefined);
    });

    readonly bulkDelete = Effect.fn('BudgetCategoryLimitRepository.bulkDelete')(function* (ids: number[]) {
        if (!isNotEmptyArray(ids)) {
            return;
        }

        yield* Db.query(db =>
            db
                .update(BudgetCategoryLimitEntityTable)
                .set({ deletedAt: new Date() })
                .where(and(inArray(BudgetCategoryLimitEntityTable.id, ids), isNull(BudgetCategoryLimitEntityTable.deletedAt)))
        );
    });

    constructor(private readonly db: DB) {}

    readonly getByBudget = (budgetId: number) =>
        Db.query(db =>
            db.query.BudgetCategoryLimitEntityTable.findMany({
                where: and(eq(BudgetCategoryLimitEntityTable.budgetId, budgetId), isNull(BudgetCategoryLimitEntityTable.deletedAt))
            })
        );

    findByBudget(budgetId: number) {
        return this.db.query.BudgetCategoryLimitEntityTable.findMany({
            where: and(eq(BudgetCategoryLimitEntityTable.budgetId, budgetId), isNull(BudgetCategoryLimitEntityTable.deletedAt))
        });
    }
}
