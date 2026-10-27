import {
    AccountEntityTable,
    AccountTypeEnum,
    transactionFilters,
    Db,
    MccCategoryEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { and, count, desc, eq, inArray, isNull, ne, notInArray, or, sql } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray } from '@rnw-community/shared';

import type { DbError } from '@budgie/contracts';
import type { SQL } from 'drizzle-orm';

export class TransactionEmbeddingRepository extends Context.Service<TransactionEmbeddingRepository>()(
    '@budgie/categorization/TransactionEmbeddingRepository',
    {
        make: Effect.sync(() => {
            const CHUNK_SIZE = 500;

            const NON_INDEXABLE_EMBEDDING_TYPES: TransactionTypeEnum[] = [TransactionTypeEnum.TRANSFER, TransactionTypeEnum.ADJUSTMENT];

            const NON_INDEXABLE_CONDITION = sql`
                (title = '' AND comment = '')
                OR type IN (${TransactionTypeEnum.TRANSFER}, ${TransactionTypeEnum.ADJUSTMENT})
                OR EXISTS (
                    SELECT 1 FROM transaction_entries te
                    INNER JOIN accounts acc ON acc.id = te.account_id
                    WHERE te.transaction_id = transactions.id
                      AND te.deleted_at IS NULL
                      AND acc.type = ${AccountTypeEnum.DEBT}
                )
            `;

            const ALREADY_INDEXED_CONDITION = sql`
                (title != '' AND EXISTS (
                    SELECT 1 FROM transaction_entries te
                    LEFT JOIN mcc_categories mcc ON mcc.id = te.mcc_category_id
                    JOIN merchant_embeddings me
                      ON me.title = transactions.title
                      AND me.mcc_description = COALESCE(mcc.full_description, '')
                      AND me.category_id = te.category_id
                      AND me.deleted_at IS NULL
                    WHERE te.transaction_id = transactions.id
                      AND te.deleted_at IS NULL
                      AND te.category_id IS NOT NULL
                ))
                OR (title = '' AND comment != '' AND EXISTS (
                    SELECT 1 FROM transaction_entries te
                    JOIN comment_embeddings ce
                      ON ce.comment = transactions.comment
                      AND ce.category_id = te.category_id
                      AND ce.deleted_at IS NULL
                    WHERE te.transaction_id = transactions.id
                      AND te.deleted_at IS NULL
                      AND te.category_id IS NOT NULL
                ))
            `;

            const AUTO_CATEGORIZABLE_TRANSACTION_CONDITION = and(
                isNull(TransactionEntityTable.updatedBy),
                or(ne(TransactionEntityTable.title, ''), ne(TransactionEntityTable.comment, '')),
                transactionFilters.buildVisibleTransactionCondition(),
                transactionFilters.buildCategorizableTypeCondition(null)
            );

            const AWAITING_AUTO_CATEGORY_WHERE = and(
                eq(TransactionEntityTable.needsEmbedding, true),
                AUTO_CATEGORIZABLE_TRANSACTION_CONDITION,
                transactionFilters.buildUncategorizedEntryCondition()
            );

            const UNCATEGORIZED_CONDITION = inArray(
                TransactionEntityTable.id,
                new QueryBuilder()
                    .select({ transactionId: TransactionEntryEntityTable.transactionId })
                    .from(TransactionEntryEntityTable)
                    .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
                    .where(transactionFilters.buildUncategorizedEntryCondition())
            );

            const updateInChunks = Effect.fnUntraced(function* (
                ids: number[],
                update: (chunk: number[]) => Effect.Effect<unknown, DbError, Db>
            ) {
                for (let start = 0; start < ids.length; start += CHUNK_SIZE) {
                    yield* update(ids.slice(start, start + CHUNK_SIZE));
                }
            });

            const clearFlagsWhere = Effect.fnUntraced(function* (condition: SQL | undefined) {
                const flaggedCondition = and(
                    sql`${TransactionEntityTable.needsEmbedding} = 1`,
                    isNull(TransactionEntityTable.deletedAt),
                    condition
                );
                const flaggedRows = yield* Db.query(db =>
                    db.select({ id: TransactionEntityTable.id }).from(TransactionEntityTable).where(flaggedCondition).limit(1)
                );

                if (isEmptyArray(flaggedRows)) {
                    return;
                }

                yield* Db.query(db => db.update(TransactionEntityTable).set({ needsEmbedding: false }).where(flaggedCondition));
            });

            return {
                countPending: () =>
                    Db.query(db =>
                        db
                            .select({ value: count() })
                            .from(TransactionEntityTable)
                            .where(and(sql`${TransactionEntityTable.needsEmbedding} = 1`, isNull(TransactionEntityTable.deletedAt)))
                    ).pipe(Effect.map(([row]) => row.value)),

                touchAndMarkForEmbeddingByIds: (ids: number[]) =>
                    updateInChunks(ids, chunk =>
                        Db.query(db =>
                            db
                                .update(TransactionEntityTable)
                                .set({
                                    updatedAt: new Date(),
                                    needsEmbedding: sql`CASE WHEN ${isNull(TransactionEntityTable.deletedAt)} AND ${notInArray(TransactionEntityTable.type, NON_INDEXABLE_EMBEDDING_TYPES)} THEN 1 ELSE ${TransactionEntityTable.needsEmbedding} END`
                                })
                                .where(inArray(TransactionEntityTable.id, chunk))
                        )
                    ),

                markForEmbeddingByIds: Effect.fn('TransactionEmbeddingRepository.markForEmbeddingByIds')(function* (ids: number[]) {
                    if (isEmptyArray(ids)) {
                        return;
                    }

                    yield* Db.query(db =>
                        db
                            .update(TransactionEntityTable)
                            .set({ needsEmbedding: true })
                            .where(
                                and(
                                    inArray(TransactionEntityTable.id, ids),
                                    eq(TransactionEntityTable.needsEmbedding, false),
                                    isNull(TransactionEntityTable.deletedAt),
                                    notInArray(TransactionEntityTable.type, NON_INDEXABLE_EMBEDDING_TYPES)
                                )
                            )
                    );
                }),

                clearNeedsEmbedding: (ids: number[]) =>
                    updateInChunks(ids, chunk =>
                        Db.query(db =>
                            db
                                .update(TransactionEntityTable)
                                .set({ needsEmbedding: false })
                                .where(and(eq(TransactionEntityTable.needsEmbedding, true), inArray(TransactionEntityTable.id, chunk)))
                        )
                    ),

                clearNonIndexableFlags: () => clearFlagsWhere(or(NON_INDEXABLE_CONDITION, UNCATEGORIZED_CONDITION)),

                clearStaleFlags: () =>
                    clearFlagsWhere(
                        or(
                            NON_INDEXABLE_CONDITION,
                            and(UNCATEGORIZED_CONDITION, sql`NOT (${AUTO_CATEGORIZABLE_TRANSACTION_CONDITION})`),
                            ALREADY_INDEXED_CONDITION
                        )
                    ),

                findAwaitingAutoCategory: (limit: number) =>
                    Db.query(db =>
                        db
                            .select({
                                transactionId: TransactionEntityTable.id,
                                title: TransactionEntityTable.title,
                                comment: TransactionEntityTable.comment,
                                mccDescription: MccCategoryEntityTable.fullDescription
                            })
                            .from(TransactionEntityTable)
                            .innerJoin(
                                TransactionEntryEntityTable,
                                eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id)
                            )
                            .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
                            .leftJoin(MccCategoryEntityTable, eq(MccCategoryEntityTable.id, TransactionEntryEntityTable.mccCategoryId))
                            .where(AWAITING_AUTO_CATEGORY_WHERE)
                            .orderBy(desc(TransactionEntityTable.operatedAt))
                            .limit(limit)
                    ),

                countAwaitingAutoCategory: () =>
                    Db.query(db =>
                        db
                            .select({ value: count() })
                            .from(TransactionEntityTable)
                            .innerJoin(
                                TransactionEntryEntityTable,
                                eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id)
                            )
                            .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
                            .where(AWAITING_AUTO_CATEGORY_WHERE)
                    ).pipe(Effect.map(([row]) => row.value)),

                markAllForEmbedding: () =>
                    Db.query(db =>
                        db.update(TransactionEntityTable).set({ needsEmbedding: true }).where(isNull(TransactionEntityTable.deletedAt))
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionEmbeddingRepository, TransactionEmbeddingRepository.make);
}
