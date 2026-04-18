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
        return this.db.$client.getAllAsync<CategoryScoreResultInterface>(this.queryConfig.similarCategoriesQuery, [
            convertEmbeddingToJson(queryEmbedding),
            vecLimit,
            distanceThreshold,
            categoryLimit
        ]);
    }

    async findSimilarTags(queryEmbedding: Uint8Array, params: SimilarTagsParamsInterface): Promise<TagScoreResultInterface[]> {
        const { vecLimit, distanceThreshold, categoryId, tagLimit } = params;

        return this.db.$client.getAllAsync<TagScoreResultInterface>(this.queryConfig.similarTagsQuery, [
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

    protected async replaceEmbeddingTags(params: ReplaceEmbeddingTagsParamsInterface): Promise<void> {
        const { tagTable, foreignKeyColumn, embeddingId, tagIds, createTagRow } = params;

        await this.db.delete(tagTable).where(eq(foreignKeyColumn, embeddingId));
        if (isNotEmptyArray(tagIds)) {
            await this.db.insert(tagTable).values(tagIds.map(createTagRow));
        }
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
