import { AccountTypeEnum, Db, TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { and, count, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isEmptyArray } from '@rnw-community/shared';

export class TransactionEmbeddingRepository extends Context.Service<TransactionEmbeddingRepository>()(
    '@budgie/categorization/TransactionEmbeddingRepository',
    {
        make: Effect.sync(() => {
            const TOUCH_CHUNK_SIZE = 500;

            const NON_INDEXABLE_EMBEDDING_TYPES: TransactionTypeEnum[] = [TransactionTypeEnum.TRANSFER, TransactionTypeEnum.ADJUSTMENT];

            return {
                countPending: () =>
                    Db.query(db =>
                        db
                            .select({ value: count() })
                            .from(TransactionEntityTable)
                            .where(and(sql`${TransactionEntityTable.needsEmbedding} = 1`, isNull(TransactionEntityTable.deletedAt)))
                    ).pipe(Effect.map(([row]) => row.value)),

                touchAndMarkForEmbeddingByIds: Effect.fn('TransactionEmbeddingRepository.touchAndMarkForEmbeddingByIds')(function* (
                    ids: number[]
                ) {
                    if (isEmptyArray(ids)) {
                        return;
                    }

                    for (let start = 0; start < ids.length; start += TOUCH_CHUNK_SIZE) {
                        const chunk = ids.slice(start, start + TOUCH_CHUNK_SIZE);

                        yield* Db.query(db =>
                            db
                                .update(TransactionEntityTable)
                                .set({
                                    updatedAt: new Date(),
                                    needsEmbedding: sql`CASE WHEN ${isNull(TransactionEntityTable.deletedAt)} AND ${notInArray(TransactionEntityTable.type, NON_INDEXABLE_EMBEDDING_TYPES)} THEN 1 ELSE ${TransactionEntityTable.needsEmbedding} END`
                                })
                                .where(inArray(TransactionEntityTable.id, chunk))
                        );
                    }
                }),

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

                clearNeedsEmbedding: Effect.fn('TransactionEmbeddingRepository.clearNeedsEmbedding')(function* (ids: number[]) {
                    if (isEmptyArray(ids)) {
                        return;
                    }
                    const CHUNK = 500;

                    for (let start = 0; start < ids.length; start += CHUNK) {
                        const chunk = ids.slice(start, start + CHUNK);

                        yield* Db.query(db =>
                            db
                                .update(TransactionEntityTable)
                                .set({ needsEmbedding: false })
                                .where(and(eq(TransactionEntityTable.needsEmbedding, true), inArray(TransactionEntityTable.id, chunk)))
                        );
                    }
                }),

                clearNonIndexableFlags: Effect.fn('TransactionEmbeddingRepository.clearNonIndexableFlags')(
                    function* () {
                        yield* Db.query(db =>
                            db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND title = ''
              AND comment = ''
        `)
                        );

                        yield* Db.query(db =>
                            db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND EXISTS (
                SELECT 1 FROM transaction_entries te
                WHERE te.transaction_id = transactions.id
                  AND te.deleted_at IS NULL
                  AND te.category_id IS NULL
              )
        `)
                        );

                        yield* Db.query(db =>
                            db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND EXISTS (
                SELECT 1 FROM transaction_entries te
                INNER JOIN accounts acc ON acc.id = te.account_id
                WHERE te.transaction_id = transactions.id
                  AND te.deleted_at IS NULL
                  AND acc.type = ${AccountTypeEnum.DEBT}
              )
        `)
                        );

                        yield* Db.query(db =>
                            db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND type IN (${TransactionTypeEnum.TRANSFER}, ${TransactionTypeEnum.ADJUSTMENT})
        `)
                        );
                    },
                    effect => Db.mutation({ type: 'update', tables: ['transactions'] }, effect)
                ),

                clearAlreadyIndexedMerchantFlags: () =>
                    Db.mutation(
                        { type: 'update', tables: ['transactions'] },
                        Db.query(db =>
                            db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND title != ''
              AND EXISTS (
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
              )
        `)
                        )
                    ),

                clearAlreadyIndexedCommentFlags: () =>
                    Db.mutation(
                        { type: 'update', tables: ['transactions'] },
                        Db.query(db =>
                            db.run(sql`
            UPDATE transactions SET needs_embedding = 0
            WHERE needs_embedding = 1
              AND deleted_at IS NULL
              AND title = ''
              AND comment != ''
              AND EXISTS (
                SELECT 1 FROM transaction_entries te
                JOIN comment_embeddings ce
                  ON ce.comment = transactions.comment
                  AND ce.category_id = te.category_id
                  AND ce.deleted_at IS NULL
                WHERE te.transaction_id = transactions.id
                  AND te.deleted_at IS NULL
                  AND te.category_id IS NOT NULL
              )
        `)
                        )
                    ),

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
