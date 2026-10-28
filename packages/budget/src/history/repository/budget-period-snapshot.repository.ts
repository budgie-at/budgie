import { BudgetPeriodCategorySnapshotEntityTable, BudgetPeriodSnapshotEntityTable, Db } from '@budgie/contracts';
import { and, eq, isNull } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { BudgetPeriodCategorySnapshotCreateEntityInterface, BudgetPeriodSnapshotCreateEntityInterface } from '@budgie/contracts';

export class BudgetPeriodSnapshotRepository extends Context.Service<BudgetPeriodSnapshotRepository>()(
    '@budgie/budget/BudgetPeriodSnapshotRepository',
    {
        make: Effect.succeed({
            create: Effect.fn('BudgetPeriodSnapshotRepository.create')(
                function* (
                    input: BudgetPeriodSnapshotCreateEntityInterface,
                    categories: readonly Omit<BudgetPeriodCategorySnapshotCreateEntityInterface, 'snapshotId'>[]
                ) {
                    const [snapshot] = yield* Db.query(db =>
                        db.insert(BudgetPeriodSnapshotEntityTable).values([input]).onConflictDoNothing().returning()
                    );

                    if (!isDefined(snapshot) || !isNotEmptyArray(categories)) {
                        return snapshot;
                    }

                    yield* Db.query(db =>
                        db
                            .insert(BudgetPeriodCategorySnapshotEntityTable)
                            .values(categories.map(category => ({ ...category, snapshotId: snapshot.id })))
                    );

                    return snapshot;
                },
                effect => Db.transaction(effect)
            ),
            findLatestPeriodStart: (budgetId: number) =>
                Db.query(db =>
                    db.query.BudgetPeriodSnapshotEntityTable.findFirst({
                        where: { budgetId, deletedAt: { isNull: true } },
                        orderBy: { periodStart: 'desc' }
                    })
                ).pipe(Effect.map(snapshot => (isDefined(snapshot) ? snapshot.periodStart : null))),
            findRecent: (budgetId: number, limit: number) =>
                Db.query(db =>
                    db.query.BudgetPeriodSnapshotEntityTable.findMany({
                        where: { budgetId, deletedAt: { isNull: true } },
                        orderBy: { periodStart: 'desc' },
                        limit,
                        with: { categories: { where: { deletedAt: { isNull: true } } } }
                    })
                ),
            findById: (id: number) =>
                Db.query(db =>
                    db.query.BudgetPeriodSnapshotEntityTable.findFirst({
                        where: { id, deletedAt: { isNull: true } },
                        with: { categories: { where: { deletedAt: { isNull: true } } } }
                    })
                ),
            markRecapsSeen: (budgetId: number) =>
                Db.query(db =>
                    db
                        .update(BudgetPeriodSnapshotEntityTable)
                        .set({ recapSeenAt: new Date() })
                        .where(
                            and(
                                eq(BudgetPeriodSnapshotEntityTable.budgetId, budgetId),
                                isNull(BudgetPeriodSnapshotEntityTable.recapSeenAt),
                                isNull(BudgetPeriodSnapshotEntityTable.deletedAt)
                            )
                        )
                )
        })
    }
) {
    static readonly layer = Layer.effect(BudgetPeriodSnapshotRepository, BudgetPeriodSnapshotRepository.make);
}
