import { and, desc, eq, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';

import { BaseEmbeddingRepository, isDefined } from '../../@generic/repository/base-embedding.repository';
import { DB } from '../../@generic/type/db.type';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { CommentPendingContextInterface } from '../interface/comment-pending-context.interface';
import { UnembeddedCommentDataInterface } from '../interface/unembedded-comment-data.interface';
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
        MAX(t.operated_at) AS maxOperatedAt
    FROM transactions t
    INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
    LEFT JOIN categories cat ON cat.id = te.category_id
    WHERE t.deleted_at IS NULL
      AND t.needs_embedding = 1
      AND t.title = ''
      AND t.comment != ''
      AND te.category_id IS NOT NULL
    GROUP BY t.comment, te.category_id
`;

const PENDING_COMMENT_CONTEXTS_QUERY = `
    WITH pending_contexts AS (${PENDING_COMMENT_CONTEXTS_BASE}),
    context_sizes AS (
        SELECT
            pc.comment AS comment,
            pc.categoryId AS categoryId,
            COUNT(DISTINCT t.id) AS groupSize
        FROM pending_contexts pc
        INNER JOIN transactions t ON t.comment = pc.comment AND t.deleted_at IS NULL AND t.title = ''
        INNER JOIN transaction_entries te ON te.transaction_id = t.id
            AND te.category_id = pc.categoryId
            AND te.deleted_at IS NULL
        GROUP BY pc.comment, pc.categoryId
    ),
    majority_tags AS (
        SELECT
            pc.comment AS comment,
            pc.categoryId AS categoryId,
            GROUP_CONCAT(tag_counts.tagId) AS tagIdsCsv
        FROM pending_contexts pc
        INNER JOIN context_sizes cs ON cs.comment = pc.comment AND cs.categoryId = pc.categoryId
        INNER JOIN (
            SELECT
                t.comment AS comment,
                te.category_id AS categoryId,
                tt.tag_id AS tagId,
                COUNT(DISTINCT t.id) AS tagCount
            FROM transactions t
            INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
            INNER JOIN transaction_tags tt ON tt.transaction_id = t.id
            WHERE t.deleted_at IS NULL AND t.title = ''
            GROUP BY t.comment, te.category_id, tt.tag_id
        ) tag_counts
          ON tag_counts.comment = pc.comment
          AND tag_counts.categoryId = pc.categoryId
          AND tag_counts.tagCount * 2 > cs.groupSize
        GROUP BY pc.comment, pc.categoryId
    )
    SELECT
        pc.comment AS comment,
        pc.categoryId AS categoryId,
        pc.categoryTitleEn AS categoryTitleEn,
        pc.transactionIdsCsv AS transactionIdsCsv,
        mt.tagIdsCsv AS tagIdsCsv,
        ce.id AS existingEmbeddingId,
        pc.maxOperatedAt AS maxOperatedAt
    FROM pending_contexts pc
    LEFT JOIN majority_tags mt ON mt.comment = pc.comment AND mt.categoryId = pc.categoryId
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

    async replaceTags(embeddingId: number, tagIds: number[]): Promise<void> {
        return this.replaceEmbeddingTags({
            tagTable: CommentEmbeddingTagEntityTable,
            foreignKeyColumn: CommentEmbeddingTagEntityTable.commentEmbeddingId,
            embeddingId,
            tagIds,
            createTagRow: tagId => ({ commentEmbeddingId: embeddingId, tagId })
        });
    }

    async findTransactionData(limit: number, cursor?: number): Promise<UnembeddedCommentDataInterface[]> {
        const entryJoinCondition = and(
            eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id),
            isNull(TransactionEntryEntityTable.deletedAt)
        );
        const commentWhereCondition = and(
            isNull(TransactionEntityTable.deletedAt),
            eq(TransactionEntityTable.title, ''),
            ne(TransactionEntityTable.comment, ''),
            isNotNull(TransactionEntryEntityTable.categoryId)
        );

        let query = this.db
            .select({
                comment: TransactionEntityTable.comment,
                categoryId: TransactionEntryEntityTable.categoryId,
                categoryTitleEn: sql<string | null>`MAX(COALESCE(${CategoryEntityTable.titleEn}, ${CategoryEntityTable.title}))`,
                tagIds: sql<string | null>`GROUP_CONCAT(DISTINCT ${TagEntityTable.id})`,
                maxOperatedAt: sql<number>`MAX(${TransactionEntityTable.operatedAt})`.as('maxOperatedAt')
            })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, entryJoinCondition)
            .leftJoin(CategoryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
            .leftJoin(TransactionTagsEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
            .leftJoin(TagEntityTable, eq(TagEntityTable.id, TransactionTagsEntityTable.tagId))
            .where(commentWhereCondition)
            .groupBy(TransactionEntityTable.comment, TransactionEntryEntityTable.categoryId)
            .orderBy(desc(sql`MAX(${TransactionEntityTable.operatedAt})`))
            .limit(limit)
            .$dynamic();

        if (isDefined(cursor)) {
            query = query.having(lt(sql`MAX(${TransactionEntityTable.operatedAt})`, cursor));
        }

        const rows = await query;
        const validRows = rows.filter((row): row is typeof row & { categoryId: number } => isDefined(row.categoryId));

        return validRows.map(row => ({
            comment: row.comment,
            categoryId: row.categoryId,
            categoryTitleEn: row.categoryTitleEn ?? null,
            tagIds: row.tagIds ?? null,
            maxOperatedAt: row.maxOperatedAt
        }));
    }

    async countAll(): Promise<number> {
        return this.countRows(CommentEmbeddingEntityTable, CommentEmbeddingEntityTable.deletedAt);
    }

    async findAllContextKeys(): Promise<string[]> {
        const results = await this.db
            .select({
                comment: CommentEmbeddingEntityTable.comment,
                categoryId: CommentEmbeddingEntityTable.categoryId
            })
            .from(CommentEmbeddingEntityTable)
            .where(isNull(CommentEmbeddingEntityTable.deletedAt));

        return results.map(row => `${row.comment}|${row.categoryId}`);
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
            categoryId: row.categoryId,
            categoryTitleEn: row.categoryTitleEn,
            transactionIds: row.transactionIdsCsv.split(',').map(Number),
            tagIds: isDefined(row.tagIdsCsv) ? row.tagIdsCsv.split(',').map(Number) : [],
            existingEmbeddingId: row.existingEmbeddingId
        }));
    }

    async countPendingCommentContexts(): Promise<number> {
        const [row] = await this.db.$client.getAllAsync<{ c: number }>(
            `SELECT COUNT(*) AS c FROM (${PENDING_COMMENT_CONTEXTS_BASE})`,
            []
        );

        return row.c;
    }

    async rebuildVecIndex(): Promise<void> {
        return this.rebuildVec();
    }

    async truncate(): Promise<void> {
        return this.truncateWithTags(CommentEmbeddingTagEntityTable, CommentEmbeddingEntityTable);
    }
}
