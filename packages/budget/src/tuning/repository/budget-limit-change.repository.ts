import { BudgetLimitChangeEntityTable, Db } from '@budgie/contracts';
import { and, eq, gte, isNull } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { BudgetLimitChangeCreateEntityInterface } from '@budgie/contracts';

export class BudgetLimitChangeRepository extends Context.Service<BudgetLimitChangeRepository>()(
    '@budgie/budget/BudgetLimitChangeRepository',
    {
        make: Effect.succeed({
            bulkCreate: Effect.fn('BudgetLimitChangeRepository.bulkCreate')(function* (inputs: BudgetLimitChangeCreateEntityInterface[]) {
                if (!isNotEmptyArray(inputs)) {
                    return [];
                }

                return yield* Db.query(db => db.insert(BudgetLimitChangeEntityTable).values(inputs).returning());
            }),
            findByBudget: (budgetId: number, limit: number) =>
                Db.query(db =>
                    db.query.BudgetLimitChangeEntityTable.findMany({
                        where: { budgetId, deletedAt: { isNull: true } },
                        orderBy: { createdAt: 'desc', id: 'desc' },
                        limit
                    })
                ),
            findSince: (budgetId: number, periodStart: Date) =>
                Db.query(db =>
                    db
                        .select()
                        .from(BudgetLimitChangeEntityTable)
                        .where(
                            and(
                                eq(BudgetLimitChangeEntityTable.budgetId, budgetId),
                                isNull(BudgetLimitChangeEntityTable.deletedAt),
                                gte(BudgetLimitChangeEntityTable.periodStart, periodStart)
                            )
                        )
                )
        })
    }
) {
    static readonly layer = Layer.effect(BudgetLimitChangeRepository, BudgetLimitChangeRepository.make);
}
