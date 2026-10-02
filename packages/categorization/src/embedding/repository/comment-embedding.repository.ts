import { CommentEmbeddingEntityTable, CommentEmbeddingTagEntityTable, Db, TransactionEntityTable } from '@budgie/contracts';
import { and, eq } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { buildVecNeighboursSql } from '../util/build-vec-neighbours-sql.util';
import { makeEmbeddingRepository } from '../util/make-embedding-repository.util';
import { parsePendingContextBaseFields } from '../util/parse-pending-context-base-fields.util';

import type { UpsertCommentEmbeddingParamsInterface } from '../interface/upsert-comment-embedding-params.interface';

const SIMILAR_CATEGORIES_QUERY = `
    SELECT ce.category_id as categoryId,
           SUM(vec.weight) as score
    FROM ${buildVecNeighboursSql('comment_embedding_vec')} vec
    JOIN comment_embeddings ce ON ce.id = vec.rowid
    WHERE ce.deleted_at IS NULL AND vec.distance < ?
    GROUP BY ce.category_id
    ORDER BY score DESC
    LIMIT ?
`;

const SIMILAR_TAGS_QUERY = `
    SELECT cet.tag_id as tagId,
           SUM(vec.weight) as score
    FROM ${buildVecNeighboursSql('comment_embedding_vec')} vec
    JOIN comment_embeddings ce ON ce.id = vec.rowid
    JOIN comment_embedding_tags cet ON cet.comment_embedding_id = ce.id
    WHERE ce.deleted_at IS NULL AND vec.distance < ? AND ce.category_id = ?
    GROUP BY cet.tag_id
    ORDER BY score DESC
    LIMIT ?
`;

const PENDING_COMMENT_CONTEXTS_BASE = `
    SELECT
        t.comment AS comment,
        te.category_id AS categoryId,
        GROUP_CONCAT(DISTINCT t.id) AS transactionIdsCsv,
        GROUP_CONCAT(DISTINCT tt.tag_id) AS tagIdsCsv,
        MAX(t.operated_at) AS maxOperatedAt
    FROM transactions t
    INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
    LEFT JOIN transaction_tags tt ON tt.transaction_id = t.id
    WHERE t.deleted_at IS NULL
      AND t.needs_embedding = 1
      AND t.title = ''
      AND t.comment != ''
      AND te.category_id IS NOT NULL
    GROUP BY t.comment, te.category_id
`;

const PENDING_COMMENT_CONTEXTS_QUERY = `
    WITH pending_contexts AS (${PENDING_COMMENT_CONTEXTS_BASE})
    SELECT
        pc.comment AS comment,
        pc.categoryId AS categoryId,
        pc.transactionIdsCsv AS transactionIdsCsv,
        pc.tagIdsCsv AS tagIdsCsv,
        ce.id AS existingEmbeddingId
    FROM pending_contexts pc
    LEFT JOIN comment_embeddings ce ON ce.comment = pc.comment
        AND ce.category_id = pc.categoryId
        AND ce.deleted_at IS NULL
    ORDER BY pc.maxOperatedAt DESC
    LIMIT ?
`;

export class CommentEmbeddingRepository extends Context.Service<CommentEmbeddingRepository>()(
    '@budgie/categorization/CommentEmbeddingRepository',
    {
        make: Effect.succeed({
            ...makeEmbeddingRepository({
                similarCategoriesQuery: SIMILAR_CATEGORIES_QUERY,
                similarTagsQuery: SIMILAR_TAGS_QUERY,
                vecTableName: 'comment_embedding_vec',
                embeddingTable: CommentEmbeddingEntityTable,
                idColumn: CommentEmbeddingEntityTable.id,
                categoryColumn: CommentEmbeddingEntityTable.categoryId,
                transactionMatchCondition: and(
                    eq(TransactionEntityTable.title, ''),
                    eq(CommentEmbeddingEntityTable.comment, TransactionEntityTable.comment)
                ),
                deletedAtColumn: CommentEmbeddingEntityTable.deletedAt,
                tagTable: CommentEmbeddingTagEntityTable,
                foreignKeyColumn: CommentEmbeddingTagEntityTable.commentEmbeddingId,
                createTagRow: (embeddingId, tagId) => ({ commentEmbeddingId: embeddingId, tagId }),
                upsertRow: (db, { comment, categoryId, embedding, dimensions }: UpsertCommentEmbeddingParamsInterface) =>
                    db
                        .insert(CommentEmbeddingEntityTable)
                        .values({ comment, categoryId, embedding, dimensions })
                        .onConflictDoUpdate({
                            target: [CommentEmbeddingEntityTable.comment, CommentEmbeddingEntityTable.categoryId],
                            set: { embedding, dimensions, updatedAt: new Date() }
                        })
                        .returning({ id: CommentEmbeddingEntityTable.id })
            }),
            findPendingCommentContexts: Effect.fn('CommentEmbeddingRepository.findPendingCommentContexts')(function* (limit: number) {
                const rows = yield* Db.query(db =>
                    db.$client.unsafe<{
                        comment: string;
                        categoryId: number;
                        transactionIdsCsv: string;
                        tagIdsCsv: string | null;
                        existingEmbeddingId: number | null;
                    }>(PENDING_COMMENT_CONTEXTS_QUERY, [limit])
                );

                return rows.map(row => ({
                    comment: row.comment,
                    ...parsePendingContextBaseFields(row)
                }));
            }),
            countPendingCommentContexts: () =>
                Db.query(db =>
                    db.$client.unsafe<{ count: number }>(`SELECT COUNT(*) AS count FROM (${PENDING_COMMENT_CONTEXTS_BASE})`, [])
                ).pipe(Effect.map(([row]) => row.count))
        })
    }
) {
    static readonly layer = Layer.effect(CommentEmbeddingRepository, CommentEmbeddingRepository.make);
}
