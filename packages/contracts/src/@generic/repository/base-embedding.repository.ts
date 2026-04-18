import { eq, isNull, sql } from 'drizzle-orm';
import { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

import { isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_DIMENSIONS } from '../constant/embedding-dimensions.constant';
import { CategoryScoreResultInterface } from '../interface/category-score-result.interface';
import { EmbeddingQueryConfigInterface } from '../interface/embedding-query-config.interface';
import { ReplaceEmbeddingTagsParamsInterface } from '../interface/replace-embedding-tags-params.interface';
import { SimilarTagsParamsInterface } from '../interface/similar-tags-params.interface';
import { TagScoreResultInterface } from '../interface/tag-score-result.interface';
import { DB } from '../type/db.type';
import { bankSyncLog } from '../util/bank-sync-log.util';
import { convertEmbeddingToJson } from '../util/convert-embedding-to-json.util';
import { transactionAsync } from '../util/transaction-async.util';

export { isDefined } from '@rnw-community/shared';

export abstract class BaseEmbeddingRepository {
    constructor(
        protected readonly db: DB,
        private readonly queryConfig: EmbeddingQueryConfigInterface
    ) {}

    async findSimilarCategories(
        queryEmbedding: Uint8Array,
        vecLimit: number,
        distanceThreshold: number,
        categoryLimit: number
    ): Promise<CategoryScoreResultInterface[]> {
        const start = Date.now();
        bankSyncLog('repo:embedding:findSimilarCategories:start', { vecTable: this.queryConfig.vecTableName, vecLimit, distanceThreshold, categoryLimit });
        const result = await this.db.$client.getAllAsync<CategoryScoreResultInterface>(this.queryConfig.similarCategoriesQuery, [
            convertEmbeddingToJson(queryEmbedding),
            vecLimit,
            distanceThreshold,
            categoryLimit
        ]);
        bankSyncLog('repo:embedding:findSimilarCategories:done', { vecTable: this.queryConfig.vecTableName, resultCount: result.length, durationMs: Date.now() - start });

        return result;
    }

    async findSimilarTags(queryEmbedding: Uint8Array, params: SimilarTagsParamsInterface): Promise<TagScoreResultInterface[]> {
        const { vecLimit, distanceThreshold, categoryId, tagLimit } = params;
        const start = Date.now();
        bankSyncLog('repo:embedding:findSimilarTags:start', { vecTable: this.queryConfig.vecTableName, vecLimit, distanceThreshold, categoryId, tagLimit });
        const result = await this.db.$client.getAllAsync<TagScoreResultInterface>(this.queryConfig.similarTagsQuery, [
            convertEmbeddingToJson(queryEmbedding),
            vecLimit,
            distanceThreshold,
            categoryId,
            tagLimit
        ]);
        bankSyncLog('repo:embedding:findSimilarTags:done', { vecTable: this.queryConfig.vecTableName, resultCount: result.length, durationMs: Date.now() - start });

        return result;
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

        const start = Date.now();
        const deleteStart = Date.now();
        await runner.delete(tagTable).where(eq(foreignKeyColumn, embeddingId));
        const deleteDurationMs = Date.now() - deleteStart;
        let insertDurationMs = 0;
        if (isNotEmptyArray(tagIds)) {
            const insertStart = Date.now();
            await runner.insert(tagTable).values(tagIds.map(createTagRow));
            insertDurationMs = Date.now() - insertStart;
        }
        bankSyncLog('repo:embedding:replaceTags', {
            embeddingId,
            tagCount: tagIds.length,
            deleteDurationMs,
            insertDurationMs,
            totalDurationMs: Date.now() - start
        });
    }

    protected async truncateWithTags(tagTable: SQLiteTable, embeddingTable: SQLiteTable): Promise<void> {
        const { vecTableName } = this.queryConfig;
        await transactionAsync(this.db, async txDb => {
            await txDb.delete(tagTable);
            await txDb.delete(embeddingTable);
            txDb.run(sql.raw(`DELETE FROM ${vecTableName}`));
        });
    }
}
