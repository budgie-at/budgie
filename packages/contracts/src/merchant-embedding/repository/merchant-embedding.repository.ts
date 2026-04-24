import { LoggerNamespaceEnum } from '../../@generic/enum/logger-namespace.enum';
import { BaseEmbeddingRepository } from '../../@generic/repository/base-embedding.repository';
import { DB } from '../../@generic/type/db.type';
import { convertEmbeddingToJson } from '../../@generic/util/convert-embedding-to-json.util';
import { getLogger } from '../../@generic/util/logger/get-logger.util';
import { Log } from '../../@generic/util/logger/log-decorator.util';
import { parsePendingContextBaseFields } from '../../@generic/util/parse-pending-context-base-fields.util';
import { MerchantEmbeddingEntityTable } from '../table/merchant-embedding-entity.table';
import { MerchantEmbeddingTagEntityTable } from '../table/merchant-embedding-tag-entity.table';

import type { CommentDistanceResultInterface } from '../interface/comment-distance-result.interface';
import type { MerchantPendingContextInterface } from '../interface/merchant-pending-context.interface';
import type { SimilarCommentsParamsInterface } from '../interface/similar-comments-params.interface';
import type { UpsertMerchantEmbeddingParamsInterface } from '../interface/upsert-merchant-embedding-params.interface';

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

const PENDING_MERCHANT_CONTEXTS_BASE = `
    SELECT
        t.title AS title,
        COALESCE(mcc.full_description, '') AS mccDescription,
        te.category_id AS categoryId,
        MAX(COALESCE(cat.title_en, cat.title)) AS categoryTitleEn,
        MAX(t.comment) AS comment,
        GROUP_CONCAT(DISTINCT t.id) AS transactionIdsCsv,
        GROUP_CONCAT(DISTINCT tt.tag_id) AS tagIdsCsv,
        MAX(t.operated_at) AS maxOperatedAt
    FROM transactions t
    INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
    LEFT JOIN mcc_categories mcc ON mcc.id = te.mcc_category_id
    LEFT JOIN categories cat ON cat.id = te.category_id
    LEFT JOIN transaction_tags tt ON tt.transaction_id = t.id
    WHERE t.deleted_at IS NULL
      AND t.needs_embedding = 1
      AND t.title != ''
      AND te.category_id IS NOT NULL
    GROUP BY t.title, COALESCE(mcc.full_description, ''), te.category_id
`;

const PENDING_MERCHANT_CONTEXTS_QUERY = `
    WITH pending_contexts AS (${PENDING_MERCHANT_CONTEXTS_BASE})
    SELECT
        pc.title AS title,
        pc.mccDescription AS mccDescription,
        pc.categoryId AS categoryId,
        pc.categoryTitleEn AS categoryTitleEn,
        pc.comment AS comment,
        pc.transactionIdsCsv AS transactionIdsCsv,
        pc.tagIdsCsv AS tagIdsCsv,
        me.id AS existingEmbeddingId
    FROM pending_contexts pc
    LEFT JOIN merchant_embeddings me ON me.title = pc.title
        AND me.mcc_description = pc.mccDescription
        AND me.category_id = pc.categoryId
        AND me.deleted_at IS NULL
    ORDER BY pc.maxOperatedAt DESC
    LIMIT ?
`;

const logger = getLogger(LoggerNamespaceEnum.REPO);

export class MerchantEmbeddingRepository extends BaseEmbeddingRepository {
    constructor(db: DB) {
        super(db, {
            similarCategoriesQuery: SIMILAR_CATEGORIES_QUERY,
            similarTagsQuery: SIMILAR_TAGS_QUERY,
            vecTableName: 'merchant_embedding_vec',
            sourceTableName: 'merchant_embeddings'
        });
    }

    @Log(LoggerNamespaceEnum.REPO, 'repo:merchantEmbedding:findSimilarComments:start')
    async findSimilarComments(
        queryEmbedding: Uint8Array,
        params: SimilarCommentsParamsInterface
    ): Promise<CommentDistanceResultInterface[]> {
        const { vecLimit, distanceThreshold, categoryId, commentLimit } = params;
        const start = Date.now();
        logger.log('repo:merchantEmbedding:findSimilarComments:start', { vecLimit, distanceThreshold, categoryId, commentLimit });
        const result = await this.db.$client.getAllAsync<CommentDistanceResultInterface>(SIMILAR_COMMENTS_QUERY, [
            convertEmbeddingToJson(queryEmbedding),
            vecLimit,
            distanceThreshold,
            categoryId,
            commentLimit
        ]);
        logger.log('repo:merchantEmbedding:findSimilarComments:done', { resultCount: result.length, durationMs: Date.now() - start });

        return result;
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

    async replaceTags(embeddingId: number, tagIds: number[], tx?: DB): Promise<void> {
        return this.replaceEmbeddingTags(
            {
                tagTable: MerchantEmbeddingTagEntityTable,
                foreignKeyColumn: MerchantEmbeddingTagEntityTable.merchantEmbeddingId,
                embeddingId,
                tagIds,
                createTagRow: tagId => ({ merchantEmbeddingId: embeddingId, tagId })
            },
            tx
        );
    }

    async countAll(): Promise<number> {
        return this.countRows(MerchantEmbeddingEntityTable, MerchantEmbeddingEntityTable.deletedAt);
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
        }>(PENDING_MERCHANT_CONTEXTS_QUERY, [limit]);

        return rows.map(row => ({
            title: row.title,
            mccDescription: row.mccDescription,
            comment: row.comment ?? '',
            ...parsePendingContextBaseFields(row)
        }));
    }

    async countPendingMerchantContexts(): Promise<number> {
        const [row] = await this.db.$client.getAllAsync<{ c: number }>(`SELECT COUNT(*) AS c FROM (${PENDING_MERCHANT_CONTEXTS_BASE})`, []);

        return row.c;
    }

    async rebuildVecIndex(): Promise<void> {
        return this.rebuildVec();
    }

    async truncate(): Promise<void> {
        return this.truncateWithTags(MerchantEmbeddingTagEntityTable, MerchantEmbeddingEntityTable);
    }
}
