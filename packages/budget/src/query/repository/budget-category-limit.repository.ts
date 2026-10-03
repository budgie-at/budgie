import { BudgetCategoryLimitEntityTable, Db } from '@budgie/contracts';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { BudgetCategoryLimitBulkUpdateInputInterface, BudgetCategoryLimitCreateEntityInterface } from '@budgie/contracts';

export class BudgetCategoryLimitRepository extends Context.Service<BudgetCategoryLimitRepository>()(
    '@budgie/budget/BudgetCategoryLimitRepository',
    {
        make: Effect.succeed({
            bulkCreate: Effect.fn('BudgetCategoryLimitRepository.bulkCreate')(function* (
                inputs: BudgetCategoryLimitCreateEntityInterface[]
            ) {
                if (!isNotEmptyArray(inputs)) {
                    return [];
                }

                return yield* Db.query(db => db.insert(BudgetCategoryLimitEntityTable).values(inputs).returning());
            }),
            bulkUpdate: Effect.fn('BudgetCategoryLimitRepository.bulkUpdate')(function* (
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
            }),
            bulkDelete: Effect.fn('BudgetCategoryLimitRepository.bulkDelete')(function* (ids: number[]) {
                if (!isNotEmptyArray(ids)) {
                    return;
                }

                yield* Db.query(db =>
                    db
                        .update(BudgetCategoryLimitEntityTable)
                        .set({ deletedAt: new Date() })
                        .where(and(inArray(BudgetCategoryLimitEntityTable.id, ids), isNull(BudgetCategoryLimitEntityTable.deletedAt)))
                );
            }),
            getByBudget: (budgetId: number) =>
                Db.query(db =>
                    db.query.BudgetCategoryLimitEntityTable.findMany({
                        where: { budgetId, deletedAt: { isNull: true } }
                    })
                )
        })
    }
) {
    static readonly layer = Layer.effect(BudgetCategoryLimitRepository, BudgetCategoryLimitRepository.make);
}
