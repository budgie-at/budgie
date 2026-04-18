import { and, desc, eq, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';

import { BaseEmbeddingRepository, isDefined } from '../../@generic/repository/base-embedding.repository';
import { DB } from '../../@generic/type/db.type';
import { convertEmbeddingToJson } from '../../@generic/util/convert-embedding-to-json.util';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { CommentDistanceResultInterface } from '../interface/comment-distance-result.interface';
import { MerchantPendingContextInterface } from '../interface/merchant-pending-context.interface';
import { SimilarCommentsParamsInterface } from '../interface/similar-comments-params.interface';
import { UnembeddedMerchantDataInterface } from '../interface/unembedded-merchant-data.interface';
import { UpsertMerchantEmbeddingParamsInterface } from '../interface/upsert-merchant-embedding-params.interface';
import { MerchantEmbeddingEntityTable } from '../table/merchant-embedding-entity.table';
import { MerchantEmbeddingTagEntityTable } from '../table/merchant-embedding-tag-entity.table';

const SIMILAR_CATEGORIES_QUERY = `
    SELECT me.category_id as categoryId,
           SUM(1.0 / (vec.distance + 0.01)) as score
    FROM (SELECT rowid, distance FROM merchant_embedding_vec
          WHERE embedding MATCH ? ORDER BY distance LIMIT ?) vec
    JOIN merchant_embeddings me ON me.id = vec.rowid
    WHERE me.deleted_at IS NULL AND vec.distance < ?
    GROUP BY me.category_id
    ORDER BY score DESC
    LIMIT ?
`;

const SIMILAR_TAGS_QUERY = `
    SELECT met.tag_id as tagId,
           SUM(1.0 / (vec.distance + 0.01)) as score
    FROM (SELECT rowid, distance FROM merchant_embedding_vec
          WHERE embedding MATCH ? ORDER BY distance LIMIT ?) vec
    JOIN merchant_embeddings me ON me.id = vec.rowid
    JOIN merchant_embedding_tags met ON met.merchant_embedding_id = me.id
    WHERE me.deleted_at IS NULL AND vec.distance < ? AND me.category_id = ?
    GROUP BY met.tag_id
    ORDER BY score DESC
    LIMIT ?
`;

const SIMILAR_COMMENTS_QUERY = `
    SELECT me.comment as comment, MIN(vec.distance) as bestDistance
    FROM (SELECT rowid, distance FROM merchant_embedding_vec
          WHERE embedding MATCH ? ORDER BY distance LIMIT ?) vec
    JOIN merchant_embeddings me ON me.id = vec.rowid
    WHERE me.deleted_at IS NULL AND vec.distance < ?
        AND me.comment != '' AND me.category_id = ?
    GROUP BY me.comment
    ORDER BY bestDistance
    LIMIT ?
`;

const PENDING_MERCHANT_CONTEXTS_QUERY = `
    WITH pending_contexts AS (
        SELECT
            t.title AS title,
            COALESCE(mcc.full_description, '') AS mccDescription,
            te.category_id AS categoryId,
            MAX(COALESCE(cat.title_en, cat.title)) AS categoryTitleEn,
            MAX(t.comment) AS comment,
            GROUP_CONCAT(DISTINCT t.id) AS transactionIdsCsv,
            MAX(t.operated_at) AS maxOperatedAt
        FROM transactions t
        INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
        LEFT JOIN mcc_categories mcc ON mcc.id = te.mcc_category_id
        LEFT JOIN categories cat ON cat.id = te.category_id
        WHERE t.deleted_at IS NULL
          AND t.needs_embedding = 1
          AND t.title != ''
          AND te.category_id IS NOT NULL
        GROUP BY t.title, COALESCE(mcc.full_description, ''), te.category_id
    ),
    context_sizes AS (
        SELECT
            pc.title AS title,
            pc.mccDescription AS mccDescription,
            pc.categoryId AS categoryId,
            COUNT(DISTINCT t.id) AS groupSize
        FROM pending_contexts pc
        INNER JOIN transactions t ON t.title = pc.title AND t.deleted_at IS NULL
        INNER JOIN transaction_entries te ON te.transaction_id = t.id
            AND te.category_id = pc.categoryId
            AND te.deleted_at IS NULL
            AND COALESCE((SELECT full_description FROM mcc_categories WHERE id = te.mcc_category_id), '') = pc.mccDescription
        GROUP BY pc.title, pc.mccDescription, pc.categoryId
    ),
    majority_tags AS (
        SELECT
            pc.title AS title,
            pc.mccDescription AS mccDescription,
            pc.categoryId AS categoryId,
            GROUP_CONCAT(tag_counts.tagId) AS tagIdsCsv
        FROM pending_contexts pc
        INNER JOIN context_sizes cs ON cs.title = pc.title
            AND cs.mccDescription = pc.mccDescription
            AND cs.categoryId = pc.categoryId
        INNER JOIN (
            SELECT
                t.title AS title,
                COALESCE((SELECT full_description FROM mcc_categories WHERE id = te.mcc_category_id), '') AS mccDescription,
                te.category_id AS categoryId,
                tt.tag_id AS tagId,
                COUNT(DISTINCT t.id) AS tagCount
            FROM transactions t
            INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
            INNER JOIN transaction_tags tt ON tt.transaction_id = t.id
            WHERE t.deleted_at IS NULL
            GROUP BY t.title, mccDescription, te.category_id, tt.tag_id
        ) tag_counts
          ON tag_counts.title = pc.title
          AND tag_counts.mccDescription = pc.mccDescription
          AND tag_counts.categoryId = pc.categoryId
          AND tag_counts.tagCount * 2 > cs.groupSize
        GROUP BY pc.title, pc.mccDescription, pc.categoryId
    )
    SELECT
        pc.title AS title,
        pc.mccDescription AS mccDescription,
        pc.categoryId AS categoryId,
        pc.categoryTitleEn AS categoryTitleEn,
        pc.comment AS comment,
        pc.transactionIdsCsv AS transactionIdsCsv,
        mt.tagIdsCsv AS tagIdsCsv,
        me.id AS existingEmbeddingId,
        pc.maxOperatedAt AS maxOperatedAt
    FROM pending_contexts pc
    LEFT JOIN majority_tags mt ON mt.title = pc.title
        AND mt.mccDescription = pc.mccDescription
        AND mt.categoryId = pc.categoryId
    LEFT JOIN merchant_embeddings me ON me.title = pc.title
        AND me.mcc_description = pc.mccDescription
        AND me.category_id = pc.categoryId
        AND me.deleted_at IS NULL
    ORDER BY pc.maxOperatedAt DESC
    LIMIT ?
`;

export class MerchantEmbeddingRepository extends BaseEmbeddingRepository {
    constructor(db: DB) {
        super(db, {
            similarCategoriesQuery: SIMILAR_CATEGORIES_QUERY,
            similarTagsQuery: SIMILAR_TAGS_QUERY,
            vecTableName: 'merchant_embedding_vec',
            sourceTableName: 'merchant_embeddings'
        });
    }

    async findSimilarComments(
        queryEmbedding: Uint8Array,
        params: SimilarCommentsParamsInterface
    ): Promise<CommentDistanceResultInterface[]> {
        const { vecLimit, distanceThreshold, categoryId, commentLimit } = params;

        return this.db.$client.getAllAsync<CommentDistanceResultInterface>(SIMILAR_COMMENTS_QUERY, [
            convertEmbeddingToJson(queryEmbedding),
            vecLimit,
            distanceThreshold,
            categoryId,
            commentLimit
        ]);
    }

    async upsert(params: UpsertMerchantEmbeddingParamsInterface): Promise<number | null> {
        const { title, mccDescription, categoryId, comment, embedding, dimensions } = params;

        if (!this.isValidDimensions(dimensions)) {
            return null;
        }

        const [row] = await this.db
            .insert(MerchantEmbeddingEntityTable)
            .values({ title, mccDescription, categoryId, comment, embedding, dimensions })
            .onConflictDoUpdate({
                target: [
                    MerchantEmbeddingEntityTable.title,
                    MerchantEmbeddingEntityTable.mccDescription,
                    MerchantEmbeddingEntityTable.categoryId
                ],
                set: { comment, embedding, dimensions, updatedAt: new Date() }
            })
            .returning({ id: MerchantEmbeddingEntityTable.id });

        await this.db.$client.runAsync('DELETE FROM merchant_embedding_vec WHERE rowid = ?', [row.id]);
        await this.db.$client.runAsync(
            'INSERT INTO merchant_embedding_vec(rowid, embedding) SELECT id, embedding FROM merchant_embeddings WHERE id = ?',
            [row.id]
        );

        return row.id;
    }

    async replaceTags(embeddingId: number, tagIds: number[]): Promise<void> {
        return this.replaceEmbeddingTags({
            tagTable: MerchantEmbeddingTagEntityTable,
            foreignKeyColumn: MerchantEmbeddingTagEntityTable.merchantEmbeddingId,
            embeddingId,
            tagIds,
            createTagRow: tagId => ({ merchantEmbeddingId: embeddingId, tagId })
        });
    }

    async findTransactionData(limit: number, cursor?: number): Promise<UnembeddedMerchantDataInterface[]> {
        const cursorCondition = isDefined(cursor) ? lt(sql`MAX(${TransactionEntityTable.operatedAt})`, cursor) : null;

        let query = this.db
            .select({
                title: TransactionEntityTable.title,
                mccDescription: sql<string>`COALESCE(${MccCategoryEntityTable.fullDescription}, '')`,
                categoryId: TransactionEntryEntityTable.categoryId,
                categoryTitleEn: sql<string | null>`MAX(COALESCE(${CategoryEntityTable.titleEn}, ${CategoryEntityTable.title}))`,
                tagIds: sql<string | null>`GROUP_CONCAT(DISTINCT ${TagEntityTable.id})`,
                comment: sql<string>`MAX(${TransactionEntityTable.comment})`,
                maxOperatedAt: sql<number>`MAX(${TransactionEntityTable.operatedAt})`.as('maxOperatedAt')
            })
            .from(TransactionEntityTable)
            .innerJoin(
                TransactionEntryEntityTable,
                and(eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id), isNull(TransactionEntryEntityTable.deletedAt))
            )
            .leftJoin(MccCategoryEntityTable, eq(MccCategoryEntityTable.id, TransactionEntryEntityTable.mccCategoryId))
            .leftJoin(CategoryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
            .leftJoin(TransactionTagsEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
            .leftJoin(TagEntityTable, eq(TagEntityTable.id, TransactionTagsEntityTable.tagId))
            .where(
                and(
                    isNull(TransactionEntityTable.deletedAt),
                    ne(TransactionEntityTable.title, ''),
                    isNotNull(TransactionEntryEntityTable.categoryId)
                )
            )
            .groupBy(TransactionEntityTable.title, MccCategoryEntityTable.fullDescription, TransactionEntryEntityTable.categoryId)
            .orderBy(desc(sql`MAX(${TransactionEntityTable.operatedAt})`))
            .limit(limit)
            .$dynamic();

        if (isDefined(cursorCondition)) {
            query = query.having(cursorCondition);
        }

        const results = await query;

        return results
            .filter((row): row is typeof row & { categoryId: number } => isDefined(row.categoryId))
            .map(row => ({
                title: row.title,
                mccDescription: row.mccDescription,
                categoryId: row.categoryId,
                categoryTitleEn: row.categoryTitleEn ?? null,
                tagIds: row.tagIds ?? null,
                comment: row.comment,
                maxOperatedAt: row.maxOperatedAt
            }));
    }

    async countAll(): Promise<number> {
        return this.countRows(MerchantEmbeddingEntityTable, MerchantEmbeddingEntityTable.deletedAt);
    }

    async findAllContextKeys(): Promise<string[]> {
        const results = await this.db
            .select({
                title: MerchantEmbeddingEntityTable.title,
                mccDescription: MerchantEmbeddingEntityTable.mccDescription,
                categoryId: MerchantEmbeddingEntityTable.categoryId
            })
            .from(MerchantEmbeddingEntityTable)
            .where(isNull(MerchantEmbeddingEntityTable.deletedAt));

        return results.map(row => `${row.title}|${row.mccDescription}|${row.categoryId}`);
    }

    async findPendingMerchantContexts(limit: number): Promise<MerchantPendingContextInterface[]> {
        const rows = await this.db.$client.getAllAsync<{
            title: string;
            mccDescription: string;
            categoryId: number;
            categoryTitleEn: string | null;
            comment: string | null;
            transactionIdsCsv: string;
            tagIdsCsv: string | null;
            existingEmbeddingId: number | null;
            maxOperatedAt: number;
        }>(PENDING_MERCHANT_CONTEXTS_QUERY, [limit]);

        return rows.map(row => ({
            title: row.title,
            mccDescription: row.mccDescription,
            categoryId: row.categoryId,
            categoryTitleEn: row.categoryTitleEn,
            comment: row.comment ?? '',
            transactionIds: row.transactionIdsCsv.split(',').map(Number),
            tagIds: row.tagIdsCsv === null ? [] : row.tagIdsCsv.split(',').map(Number),
            existingEmbeddingId: row.existingEmbeddingId
        }));
    }

    async countPendingMerchantContexts(): Promise<number> {
        const [row] = await this.db.$client.getAllAsync<{ c: number }>(
            `SELECT COUNT(*) AS c FROM (
                SELECT 1
                FROM transactions t
                INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
                WHERE t.deleted_at IS NULL
                  AND t.needs_embedding = 1
                  AND t.title != ''
                  AND te.category_id IS NOT NULL
                GROUP BY t.title, COALESCE((SELECT full_description FROM mcc_categories WHERE id = te.mcc_category_id), ''), te.category_id
            )`,
            []
        );

        return row.c;
    }

    async rebuildVecIndex(): Promise<void> {
        return this.rebuildVec();
    }

    async truncate(): Promise<void> {
        return this.truncateWithTags(MerchantEmbeddingTagEntityTable, MerchantEmbeddingEntityTable);
    }
}
