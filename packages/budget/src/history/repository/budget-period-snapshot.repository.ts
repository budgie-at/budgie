import { BudgetPeriodCategorySnapshotEntityTable, BudgetPeriodSnapshotEntityTable, Db } from '@budgie/contracts';
import { and, eq, isNull } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { BudgetPeriodCategorySnapshotUpdateInterface } from '../interface/budget-period-category-snapshot-update.interface';
import type { BudgetPeriodSnapshotUpdateInterface } from '../interface/budget-period-snapshot-update.interface';
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
            updateSnapshot: (id: number, input: BudgetPeriodSnapshotUpdateInterface) =>
                Db.query(db => db.update(BudgetPeriodSnapshotEntityTable).set(input).where(eq(BudgetPeriodSnapshotEntityTable.id, id))),
            updateCategorySnapshot: (id: number, input: BudgetPeriodCategorySnapshotUpdateInterface) =>
                Db.query(db =>
                    db.update(BudgetPeriodCategorySnapshotEntityTable).set(input).where(eq(BudgetPeriodCategorySnapshotEntityTable.id, id))
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
