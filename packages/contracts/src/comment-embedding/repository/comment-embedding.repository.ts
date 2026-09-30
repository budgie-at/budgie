import * as Effect from 'effect/Effect';

import { BaseEmbeddingRepository } from '../../@generic/repository/base-embedding.repository';
import { Db } from '../../@generic/service/db.service';
import { parsePendingContextBaseFields } from '../../@generic/util/parse-pending-context-base-fields.util';
import { UpsertCommentEmbeddingParamsInterface } from '../interface/upsert-comment-embedding-params.interface';
import { CommentEmbeddingEntityTable } from '../table/comment-embedding-entity.table';
import { CommentEmbeddingTagEntityTable } from '../table/comment-embedding-tag-entity.table';

const SIMILAR_CATEGORIES_QUERY = `
    SELECT ce.category_id as categoryId,
           SUM(1.0 / (vec.distance + 0.01)) as score
    FROM (SELECT rowid, distance FROM comment_embedding_vec
          WHERE embedding MATCH ? ORDER BY distance LIMIT ?) vec
    JOIN comment_embeddings ce ON ce.id = vec.rowid
    WHERE ce.deleted_at IS NULL AND vec.distance < ?
    GROUP BY ce.category_id
    ORDER BY score DESC
    LIMIT ?
`;

const SIMILAR_TAGS_QUERY = `
    SELECT cet.tag_id as tagId,
           SUM(1.0 / (vec.distance + 0.01)) as score
    FROM (SELECT rowid, distance FROM comment_embedding_vec
          WHERE embedding MATCH ? ORDER BY distance LIMIT ?) vec
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
        MAX(COALESCE(cat.title_en, cat.title)) AS categoryTitleEn,
        GROUP_CONCAT(DISTINCT t.id) AS transactionIdsCsv,
        GROUP_CONCAT(DISTINCT tt.tag_id) AS tagIdsCsv,
        MAX(t.operated_at) AS maxOperatedAt
    FROM transactions t
    INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
    LEFT JOIN categories cat ON cat.id = te.category_id
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
        pc.categoryTitleEn AS categoryTitleEn,
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

export class CommentEmbeddingRepository extends BaseEmbeddingRepository {
    readonly upsert = Effect.fn('CommentEmbeddingRepository.upsert')(function* (
        this: CommentEmbeddingRepository,
        params: UpsertCommentEmbeddingParamsInterface
    ) {
        const { comment, categoryId, embedding, dimensions } = params;

        if (!this.isValidDimensions(dimensions)) {
            return null;
        }

        const [row] = yield* Db.query(db =>
            db
                .insert(CommentEmbeddingEntityTable)
                .values({ comment, categoryId, embedding, dimensions })
                .onConflictDoUpdate({
                    target: [CommentEmbeddingEntityTable.comment, CommentEmbeddingEntityTable.categoryId],
                    set: { embedding, dimensions, updatedAt: new Date() }
                })
                .returning({ id: CommentEmbeddingEntityTable.id })
        );

        yield* Db.query(db => db.$client.runAsync('DELETE FROM comment_embedding_vec WHERE rowid = ?', [row.id]));
        yield* Db.query(db =>
            db.$client.runAsync(
                'INSERT INTO comment_embedding_vec(rowid, embedding) SELECT id, embedding FROM comment_embeddings WHERE id = ?',
                [row.id]
            )
        );

        return row.id;
    });

    readonly replaceTags = Effect.fn('CommentEmbeddingRepository.replaceTags')(function* (
        this: CommentEmbeddingRepository,
        embeddingId: number,
        tagIds: number[]
    ) {
        yield* this.replaceEmbeddingTags({
            tagTable: CommentEmbeddingTagEntityTable,
            foreignKeyColumn: CommentEmbeddingTagEntityTable.commentEmbeddingId,
            embeddingId,
            tagIds,
            createTagRow: tagId => ({ commentEmbeddingId: embeddingId, tagId })
        });
    });

    readonly countAll = Effect.fn('CommentEmbeddingRepository.countAll')(function* (this: CommentEmbeddingRepository) {
        return yield* this.countRows(CommentEmbeddingEntityTable, CommentEmbeddingEntityTable.deletedAt);
    });

    readonly findPendingCommentContexts = Effect.fn('CommentEmbeddingRepository.findPendingCommentContexts')(function* (limit: number) {
        const rows = yield* Db.query(db =>
            db.$client.getAllAsync<{
                comment: string;
                categoryId: number;
                categoryTitleEn: string | null;
                transactionIdsCsv: string;
                tagIdsCsv: string | null;
                existingEmbeddingId: number | null;
            }>(PENDING_COMMENT_CONTEXTS_QUERY, [limit])
        );

        return rows.map(row => ({
            comment: row.comment,
            ...parsePendingContextBaseFields(row)
        }));
    });

    readonly truncate = Effect.fn('CommentEmbeddingRepository.truncate')(function* (this: CommentEmbeddingRepository) {
        yield* this.truncateWithTags(CommentEmbeddingTagEntityTable, CommentEmbeddingEntityTable);
    });

    constructor() {
        super({
            similarCategoriesQuery: SIMILAR_CATEGORIES_QUERY,
            similarTagsQuery: SIMILAR_TAGS_QUERY,
            vecTableName: 'comment_embedding_vec',
            sourceTableName: 'comment_embeddings'
        });
    }

    readonly countPendingCommentContexts = () =>
        Db.query(db =>
            db.$client.getAllAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM (${PENDING_COMMENT_CONTEXTS_BASE})`, [])
        ).pipe(Effect.map(([row]) => row.count));
}
