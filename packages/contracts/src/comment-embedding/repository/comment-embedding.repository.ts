import { BaseEmbeddingRepository } from '../../@generic/repository/base-embedding.repository';
import { DB } from '../../@generic/type/db.type';
import { parsePendingContextBaseFields } from '../../@generic/util/parse-pending-context-base-fields.util';
import { CommentPendingContextInterface } from '../interface/comment-pending-context.interface';
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
    constructor(db: DB) {
        super(db, {
            similarCategoriesQuery: SIMILAR_CATEGORIES_QUERY,
            similarTagsQuery: SIMILAR_TAGS_QUERY,
            vecTableName: 'comment_embedding_vec',
            sourceTableName: 'comment_embeddings'
        });
    }

    async upsert(params: UpsertCommentEmbeddingParamsInterface): Promise<number | null> {
        const { comment, categoryId, embedding, dimensions } = params;

        if (!this.isValidDimensions(dimensions)) {
            return null;
        }

        const [row] = await this.db
            .insert(CommentEmbeddingEntityTable)
            .values({ comment, categoryId, embedding, dimensions })
            .onConflictDoUpdate({
                target: [CommentEmbeddingEntityTable.comment, CommentEmbeddingEntityTable.categoryId],
                set: { embedding, dimensions, updatedAt: new Date() }
            })
            .returning({ id: CommentEmbeddingEntityTable.id });

        await this.db.$client.runAsync('DELETE FROM comment_embedding_vec WHERE rowid = ?', [row.id]);
        await this.db.$client.runAsync(
            'INSERT INTO comment_embedding_vec(rowid, embedding) SELECT id, embedding FROM comment_embeddings WHERE id = ?',
            [row.id]
        );

        return row.id;
    }

    async replaceTags(embeddingId: number, tagIds: number[], tx?: DB): Promise<void> {
        return this.replaceEmbeddingTags(
            {
                tagTable: CommentEmbeddingTagEntityTable,
                foreignKeyColumn: CommentEmbeddingTagEntityTable.commentEmbeddingId,
                embeddingId,
                tagIds,
                createTagRow: tagId => ({ commentEmbeddingId: embeddingId, tagId })
            },
            tx
        );
    }

    async countAll(): Promise<number> {
        return this.countRows(CommentEmbeddingEntityTable, CommentEmbeddingEntityTable.deletedAt);
    }

    async findPendingCommentContexts(limit: number): Promise<CommentPendingContextInterface[]> {
        const rows = await this.db.$client.getAllAsync<{
            comment: string;
            categoryId: number;
            categoryTitleEn: string | null;
            transactionIdsCsv: string;
            tagIdsCsv: string | null;
            existingEmbeddingId: number | null;
        }>(PENDING_COMMENT_CONTEXTS_QUERY, [limit]);

        return rows.map(row => ({
            comment: row.comment,
            ...parsePendingContextBaseFields(row)
        }));
    }

    async countPendingCommentContexts(): Promise<number> {
        const [row] = await this.db.$client.getAllAsync<{ c: number }>(`SELECT COUNT(*) AS c FROM (${PENDING_COMMENT_CONTEXTS_BASE})`, []);

        return row.c;
    }

    async rebuildVecIndex(): Promise<void> {
        return this.rebuildVec();
    }

    async truncate(): Promise<void> {
        return this.truncateWithTags(CommentEmbeddingTagEntityTable, CommentEmbeddingEntityTable);
    }
}
