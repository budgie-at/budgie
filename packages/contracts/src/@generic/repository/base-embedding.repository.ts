import { Log } from '@budgie/logger';
import { eq, isNull, sql } from 'drizzle-orm';
import { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

import { getErrorMessage, isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_DIMENSIONS } from '../constant/embedding-dimensions.constant';
import { EmbeddingQueryConfigInterface } from '../interface/embedding-query-config.interface';
import { DB } from '../type/db.type';
import { convertEmbeddingToJson } from '../util/convert-embedding-to-json.util';
import { transactionAsync } from '../util/transaction-async.util';

import type { CategoryScoreResultInterface } from '../interface/category-score-result.interface';
import type { ReplaceEmbeddingTagsParamsInterface } from '../interface/replace-embedding-tags-params.interface';
import type { SimilarTagsParamsInterface } from '../interface/similar-tags-params.interface';
import type { TagScoreResultInterface } from '../interface/tag-score-result.interface';

export abstract class BaseEmbeddingRepository {
    constructor(
        protected readonly db: DB,
        private readonly queryConfig: EmbeddingQueryConfigInterface
    ) {}

    @Log(
        (queryEmbedding, vecLimit, distanceThreshold, categoryLimit) =>
            `enter queryEmbeddingLen=${queryEmbedding.length} vecLimit=${vecLimit} distanceThreshold=${distanceThreshold} categoryLimit=${categoryLimit}`,
        (result, ...[queryEmbedding, vecLimit, distanceThreshold, categoryLimit]) =>
            `done queryEmbeddingLen=${queryEmbedding.length} vecLimit=${vecLimit} distanceThreshold=${distanceThreshold} categoryLimit=${categoryLimit} categoryIds=${result.map(row => row.categoryId).join(',')}`,
        (error, ...[queryEmbedding, vecLimit, distanceThreshold, categoryLimit]) =>
            `throw queryEmbeddingLen=${queryEmbedding.length} vecLimit=${vecLimit} distanceThreshold=${distanceThreshold} categoryLimit=${categoryLimit} error=${getErrorMessage(error)}`
    )
    async findSimilarCategories(
        queryEmbedding: Uint8Array,
        vecLimit: number,
        distanceThreshold: number,
        categoryLimit: number
    ): Promise<CategoryScoreResultInterface[]> {
        return await this.db.$client.getAllAsync<CategoryScoreResultInterface>(this.queryConfig.similarCategoriesQuery, [
            convertEmbeddingToJson(queryEmbedding),
            vecLimit,
            distanceThreshold,
            categoryLimit
        ]);
    }

    @Log(
        (queryEmbedding, params) =>
            `enter queryEmbeddingLen=${queryEmbedding.length} vecLimit=${params.vecLimit} distanceThreshold=${params.distanceThreshold} categoryId=${params.categoryId} tagLimit=${params.tagLimit}`,
        (result, queryEmbedding, params) =>
            `done queryEmbeddingLen=${queryEmbedding.length} vecLimit=${params.vecLimit} distanceThreshold=${params.distanceThreshold} categoryId=${params.categoryId} tagLimit=${params.tagLimit} tagIds=${result.map(row => row.tagId).join(',')}`,
        (error, queryEmbedding, params) =>
            `throw queryEmbeddingLen=${queryEmbedding.length} vecLimit=${params.vecLimit} distanceThreshold=${params.distanceThreshold} categoryId=${params.categoryId} tagLimit=${params.tagLimit} error=${getErrorMessage(error)}`
    )
    async findSimilarTags(queryEmbedding: Uint8Array, params: SimilarTagsParamsInterface): Promise<TagScoreResultInterface[]> {
        const { vecLimit, distanceThreshold, categoryId, tagLimit } = params;

        return await this.db.$client.getAllAsync<TagScoreResultInterface>(this.queryConfig.similarTagsQuery, [
            convertEmbeddingToJson(queryEmbedding),
            vecLimit,
            distanceThreshold,
            categoryId,
            tagLimit
        ]);
    }

    protected isValidDimensions(dimensions: number): boolean {
        return dimensions === EMBEDDING_DIMENSIONS;
    }

    protected async countRows(table: SQLiteTable, deletedAtColumn: SQLiteColumn): Promise<number> {
        const [result] = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(table)
            .where(isNull(deletedAtColumn));

        return result.count;
    }

    protected async rebuildVec(): Promise<void> {
        const { vecTableName, sourceTableName } = this.queryConfig;
        await this.db.$client.runAsync(`DELETE FROM ${vecTableName}`, []);
        await this.db.$client.runAsync(
            `INSERT INTO ${vecTableName}(rowid, embedding) SELECT id, embedding FROM ${sourceTableName} WHERE deleted_at IS NULL`,
            []
        );
    }

    protected async replaceEmbeddingTags(params: ReplaceEmbeddingTagsParamsInterface, tx?: DB): Promise<void> {
        const { tagTable, foreignKeyColumn, embeddingId, tagIds, createTagRow } = params;
        const runner = tx ?? this.db;

        await runner.delete(tagTable).where(eq(foreignKeyColumn, embeddingId));
        if (isNotEmptyArray(tagIds)) {
            await runner.insert(tagTable).values(tagIds.map(createTagRow));
        }
    }

    protected async truncateWithTags(tagTable: SQLiteTable, embeddingTable: SQLiteTable): Promise<void> {
        const { vecTableName } = this.queryConfig;
        await transactionAsync(this.db, async txDb => {
            await txDb.delete(tagTable);
            await txDb.delete(embeddingTable);
            await Promise.resolve(txDb.run(sql.raw(`DELETE FROM ${vecTableName}`)));
        });
    }
}
