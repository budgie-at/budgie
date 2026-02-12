import { isNull, sql } from 'drizzle-orm';
import { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

import { CategoryScoreResultInterface } from '../../merchant-embedding/interface/category-score-result.interface';
import { SimilarTagsParamsInterface } from '../../merchant-embedding/interface/similar-tags-params.interface';
import { TagScoreResultInterface } from '../../merchant-embedding/interface/tag-score-result.interface';
import { DB, RawDb } from '../type/db.type';
import { convertEmbeddingToJson } from '../util/convert-embedding-to-json.util';

interface EmbeddingQueryConfigInterface {
    readonly similarCategoriesQuery: string;
    readonly similarTagsQuery: string;
}

export abstract class BaseEmbeddingRepository {
    constructor(
        protected readonly db: DB,
        protected readonly rawDb: RawDb,
        private readonly queryConfig: EmbeddingQueryConfigInterface
    ) {}

    async findSimilarCategories(
        queryEmbedding: Uint8Array,
        vecLimit: number,
        distanceThreshold: number,
        categoryLimit: number
    ): Promise<CategoryScoreResultInterface[]> {
        return this.rawDb.getAllAsync<CategoryScoreResultInterface>(this.queryConfig.similarCategoriesQuery, [
            convertEmbeddingToJson(queryEmbedding),
            vecLimit,
            distanceThreshold,
            categoryLimit
        ]);
    }

    async findSimilarTags(queryEmbedding: Uint8Array, params: SimilarTagsParamsInterface): Promise<TagScoreResultInterface[]> {
        const { vecLimit, distanceThreshold, categoryId, tagLimit } = params;

        return this.rawDb.getAllAsync<TagScoreResultInterface>(this.queryConfig.similarTagsQuery, [
            convertEmbeddingToJson(queryEmbedding),
            vecLimit,
            distanceThreshold,
            categoryId,
            tagLimit
        ]);
    }

    protected async countRows(table: SQLiteTable, deletedAtColumn: SQLiteColumn): Promise<number> {
        const [result] = await this.db
            .select({ count: sql<number>`COUNT(*)` })
            .from(table)
            .where(isNull(deletedAtColumn));

        return result.count;
    }

    protected async rebuildVec(vecTableName: string, sourceTableName: string): Promise<void> {
        await this.rawDb.runAsync(`DELETE FROM ${vecTableName}`, []);
        await this.rawDb.runAsync(
            `INSERT INTO ${vecTableName}(rowid, embedding) SELECT id, embedding FROM ${sourceTableName} WHERE deleted_at IS NULL`,
            []
        );
    }

    protected async truncateWithTags(tagTable: SQLiteTable, embeddingTable: SQLiteTable, vecTableName: string): Promise<void> {
        await this.db.transaction(async transaction => {
            await transaction.delete(tagTable);
            await transaction.delete(embeddingTable);
            await this.rawDb.runAsync(`DELETE FROM ${vecTableName}`, []);
        });
    }
}
