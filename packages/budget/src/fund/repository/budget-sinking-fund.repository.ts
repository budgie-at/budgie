import { BudgetSinkingFundEntityTable, Db } from '@budgie/contracts';
import { and, eq, isNull } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import type { BudgetSinkingFundCreateEntityInterface, BudgetSinkingFundUpdateEntityInterface } from '@budgie/contracts';

export class BudgetSinkingFundRepository extends Context.Service<BudgetSinkingFundRepository>()(
    '@budgie/budget/BudgetSinkingFundRepository',
    {
        make: Effect.succeed({
            create: (input: BudgetSinkingFundCreateEntityInterface) =>
                Db.query(db => db.insert(BudgetSinkingFundEntityTable).values([input]).returning()).pipe(Effect.map(([fund]) => fund)),
            update: (id: number, input: BudgetSinkingFundUpdateEntityInterface) =>
                Db.query(db =>
                    db.update(BudgetSinkingFundEntityTable).set(input).where(eq(BudgetSinkingFundEntityTable.id, id)).returning()
                ).pipe(Effect.map(([fund]) => fund)),
            delete: (id: number) =>
                Db.query(db =>
                    db
                        .update(BudgetSinkingFundEntityTable)
                        .set({ deletedAt: new Date() })
                        .where(and(eq(BudgetSinkingFundEntityTable.id, id), isNull(BudgetSinkingFundEntityTable.deletedAt)))
                ),
            getByBudget: (budgetId: number) =>
                Db.query(db =>
                    db.query.BudgetSinkingFundEntityTable.findMany({
                        where: { budgetId, deletedAt: { isNull: true } },
                        orderBy: { dueAt: 'asc' }
                    })
                )
        })
    }
) {
    static readonly layer = Layer.effect(BudgetSinkingFundRepository, BudgetSinkingFundRepository.make);
}
