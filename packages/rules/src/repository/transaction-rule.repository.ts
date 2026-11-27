import {
    transactionFilters,
    CategorySourceEnum,
    Db,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { and, desc, eq, inArray, isNull, lt, ne, sql } from 'drizzle-orm';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { RULE_SET_BATCH_SIZE } from '../constant/batch-processing.constant';

import type { SQL } from 'drizzle-orm';

export class TransactionRuleRepository extends Context.Service<TransactionRuleRepository>()('@budgie/rules/TransactionRuleRepository', {
    make: Effect.sync(() => {
        const LIGHTWEIGHT_RULE_COLUMNS = {
            id: TransactionEntityTable.id,
            type: TransactionEntityTable.type,
            title: TransactionEntityTable.title,
            comment: TransactionEntityTable.comment,
            fromAccountId: TransactionEntityTable.fromAccountId,
            toAccountId: TransactionEntityTable.toAccountId,
            externalSource: TransactionEntityTable.externalSource
        };

        const HAS_LIVE_LEDGER_ENTRY_SQL = sql`EXISTS (SELECT 1 FROM ${TransactionEntryEntityTable} WHERE ${and(
            eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id),
            transactionFilters.buildLedgerEntryCondition()
        )})`;

        const buildVisibleNonAdjustmentWhere = (...extra: readonly SQL[]): SQL | undefined =>
            and(
                transactionFilters.buildVisibleTransactionCondition(),
                ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
                HAS_LIVE_LEDGER_ENTRY_SQL,
                ...extra
            );

        const stampUpdatedByRuleWhere = Effect.fnUntraced(function* (transactionIds: number[], extraCondition: SQL) {
            if (!isNotEmptyArray(transactionIds)) {
                return;
            }

            yield* Db.query(db =>
                db
                    .update(TransactionEntityTable)
                    .set({ updatedBy: TransactionUpdatedByEnum.RULE })
                    .where(
                        and(
                            inArray(TransactionEntityTable.id, transactionIds),
                            transactionFilters.buildVisibleTransactionCondition(),
                            extraCondition
                        )
                    )
            );
        });

        return {
            countByRuleConditions: (where: SQL) =>
                Db.query(db =>
                    db
                        .select({ count: sql<number>`COUNT(*)` })
                        .from(TransactionEntityTable)
                        .where(buildVisibleNonAdjustmentWhere(where))
                ).pipe(Effect.map(result => result[0]?.count ?? 0)),
            findIdsByRuleConditions: (where: SQL) =>
                Db.query(db =>
                    db.select({ id: TransactionEntityTable.id }).from(TransactionEntityTable).where(buildVisibleNonAdjustmentWhere(where))
                ).pipe(Effect.map(result => result.map(row => row.id))),
            findLightweightByIds: Effect.fn('TransactionRuleRepository.findLightweightByIds')(function* (ids: readonly number[]) {
                if (!isNotEmptyArray(ids)) {
                    return [];
                }

                const batches = yield* Effect.forEach(Arr.chunksOf(ids, RULE_SET_BATCH_SIZE), chunk =>
                    Db.query(db =>
                        db
                            .select(LIGHTWEIGHT_RULE_COLUMNS)
                            .from(TransactionEntityTable)
                            .where(buildVisibleNonAdjustmentWhere(inArray(TransactionEntityTable.id, chunk)))
                    )
                );

                return batches.flat();
            }),
            findLightweightForRuleMatchingAfter: (cursorId: number | null, limit: number) =>
                Db.query(db =>
                    db
                        .select(LIGHTWEIGHT_RULE_COLUMNS)
                        .from(TransactionEntityTable)
                        .where(buildVisibleNonAdjustmentWhere(...(isDefined(cursorId) ? [lt(TransactionEntityTable.id, cursorId)] : [])))
                        .orderBy(desc(TransactionEntityTable.id))
                        .limit(limit)
                ),
            setCategoryByTransactionIds: Effect.fn('TransactionRuleRepository.setCategoryByTransactionIds')(function* (
                transactionIds: number[],
                categoryId: number
            ) {
                if (!isNotEmptyArray(transactionIds)) {
                    return [];
                }

                const changedEntries = yield* Db.query(db =>
                    db
                        .update(TransactionEntryEntityTable)
                        .set({ categoryId, categorySource: CategorySourceEnum.RULE })
                        .where(
                            and(
                                inArray(
                                    TransactionEntryEntityTable.transactionId,
                                    db
                                        .select({ id: TransactionEntityTable.id })
                                        .from(TransactionEntityTable)
                                        .where(
                                            and(
                                                inArray(TransactionEntityTable.id, transactionIds),
                                                transactionFilters.buildVisibleTransactionCondition(),
                                                transactionFilters.buildCategorizableTypeCondition(null)
                                            )
                                        )
                                ),
                                transactionFilters.buildCategorizableEntryCondition(),
                                sql`${TransactionEntryEntityTable.categoryId} IS NOT ${categoryId}`
                            )
                        )
                        .returning({ transactionId: TransactionEntryEntityTable.transactionId })
                );

                return [...new Set(changedEntries.map(entry => entry.transactionId))];
            }),
            stampUpdatedByRule: Effect.fn('TransactionRuleRepository.stampUpdatedByRule')(function* (transactionIds: number[]) {
                yield* stampUpdatedByRuleWhere(
                    transactionIds,
                    sql`${TransactionEntityTable.updatedBy} IS NOT ${TransactionUpdatedByEnum.RULE}`
                );
            }),
            stampUnauthoredUpdatedByRule: Effect.fn('TransactionRuleRepository.stampUnauthoredUpdatedByRule')(function* (
                transactionIds: number[]
            ) {
                yield* stampUpdatedByRuleWhere(transactionIds, isNull(TransactionEntityTable.updatedBy));
            })
        };
    })
}) {
    static readonly layer = Layer.effect(TransactionRuleRepository, TransactionRuleRepository.make);
}
