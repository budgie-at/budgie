import { BudgetCategoryLimitEntityTable, Db } from '@budgie/contracts';
import { and, inArray, isNull, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { BudgetCategoryLimitTuneInputInterface } from '../../tuning/interface/budget-category-limit-tune-input.interface';
import type {
    BudgetCategoryLimitBulkUpdateInputInterface,
    BudgetCategoryLimitCreateEntityInterface,
    BudgetCategoryLimitEntityInterface
} from '@budgie/contracts';
import type { SQL, SQLWrapper } from 'drizzle-orm';

export class BudgetCategoryLimitRepository extends Context.Service<BudgetCategoryLimitRepository>()(
    '@budgie/budget/BudgetCategoryLimitRepository',
    {
        make: Effect.sync(() => {
            const batchChunkSize = 100;

            const buildCaseSql = (entries: readonly (readonly [number, SQLWrapper | number | string])[], fallbackColumn: SQLWrapper): SQL =>
                sql.join(
                    [
                        sql`CASE ${BudgetCategoryLimitEntityTable.id}`,
                        ...entries.map(([id, value]) => sql`WHEN ${id} THEN ${value}`),
                        sql`ELSE ${fallbackColumn} END`
                    ],
                    sql` `
                );

            return {
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
                    if (!isNotEmptyArray(updates)) {
                        return [];
                    }

                    return yield* Db.transaction(
                        Effect.gen(function* () {
                            const updatedRows: BudgetCategoryLimitEntityInterface[] = [];

                            for (let start = 0; start < updates.length; start += batchChunkSize) {
                                const chunk = updates.slice(start, start + batchChunkSize);
                                const ids = chunk.map(update => update.id);
                                const rolloverEntries = chunk.flatMap(update =>
                                    isDefined(update.rolloverMode) ? [[update.id, update.rolloverMode] as const] : []
                                );
                                const editedAtEntries = chunk.flatMap(update =>
                                    isDefined(update.userEditedAt)
                                        ? [[update.id, Math.floor(update.userEditedAt.getTime() / 1000)] as const]
                                        : []
                                );
                                const limitAmountCase = buildCaseSql(
                                    chunk.map(update => [update.id, update.limitAmount] as const),
                                    BudgetCategoryLimitEntityTable.limitAmount
                                );
                                const chunkRows = yield* Db.query(db =>
                                    db
                                        .update(BudgetCategoryLimitEntityTable)
                                        .set({
                                            limitAmount: limitAmountCase,
                                            ...(isNotEmptyArray(rolloverEntries) && {
                                                rolloverMode: buildCaseSql(rolloverEntries, BudgetCategoryLimitEntityTable.rolloverMode)
                                            }),
                                            ...(isNotEmptyArray(editedAtEntries) && {
                                                userEditedAt: buildCaseSql(editedAtEntries, BudgetCategoryLimitEntityTable.userEditedAt)
                                            })
                                        })
                                        .where(inArray(BudgetCategoryLimitEntityTable.id, ids))
                                        .returning()
                                );

                                updatedRows.push(...chunkRows);
                            }

                            return updatedRows;
                        })
                    );
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
                applyTunedLimits: Effect.fn('BudgetCategoryLimitRepository.applyTunedLimits')(function* (
                    updates: readonly BudgetCategoryLimitTuneInputInterface[]
                ) {
                    if (!isNotEmptyArray(updates)) {
                        return;
                    }

                    yield* Db.transaction(
                        Effect.gen(function* () {
                            for (let start = 0; start < updates.length; start += batchChunkSize) {
                                const chunk = updates.slice(start, start + batchChunkSize);
                                const ids = chunk.map(update => update.id);
                                const limitAmountCase = buildCaseSql(
                                    chunk.map(update => [update.id, update.limitAmount] as const),
                                    BudgetCategoryLimitEntityTable.limitAmount
                                );

                                yield* Db.query(db =>
                                    db
                                        .update(BudgetCategoryLimitEntityTable)
                                        .set({ limitAmount: limitAmountCase })
                                        .where(inArray(BudgetCategoryLimitEntityTable.id, ids))
                                );
                            }
                        })
                    );
                }),
                getByBudget: (budgetId: number) =>
                    Db.query(db =>
                        db.query.BudgetCategoryLimitEntityTable.findMany({
                            where: { budgetId, deletedAt: { isNull: true } }
                        })
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(BudgetCategoryLimitRepository, BudgetCategoryLimitRepository.make);
}
