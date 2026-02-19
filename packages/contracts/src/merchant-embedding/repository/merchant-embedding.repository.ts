import { and, desc, eq, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';

import { BaseEmbeddingRepository, isDefined } from '../../@generic/repository/base-embedding.repository';
import { DB, RawDb } from '../../@generic/type/db.type';
import { convertEmbeddingToJson } from '../../@generic/util/convert-embedding-to-json.util';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { CommentDistanceResultInterface } from '../interface/comment-distance-result.interface';
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

export class MerchantEmbeddingRepository extends BaseEmbeddingRepository {
    constructor(db: DB, rawDb: RawDb) {
        super(db, rawDb, { similarCategoriesQuery: SIMILAR_CATEGORIES_QUERY, similarTagsQuery: SIMILAR_TAGS_QUERY });
    }

    async findSimilarComments(
        queryEmbedding: Uint8Array,
        params: SimilarCommentsParamsInterface
    ): Promise<CommentDistanceResultInterface[]> {
        const { vecLimit, distanceThreshold, categoryId, commentLimit } = params;

        return this.rawDb.getAllAsync<CommentDistanceResultInterface>(SIMILAR_COMMENTS_QUERY, [
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

        await this.rawDb.runAsync(
            'INSERT OR REPLACE INTO merchant_embedding_vec(rowid, embedding) SELECT id, embedding FROM merchant_embeddings WHERE id = ?',
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

    async rebuildVecIndex(): Promise<void> {
        return this.rebuildVec('merchant_embedding_vec', 'merchant_embeddings');
    }

    async truncate(): Promise<void> {
        return this.truncateWithTags(MerchantEmbeddingTagEntityTable, MerchantEmbeddingEntityTable, 'merchant_embedding_vec');
    }
}
