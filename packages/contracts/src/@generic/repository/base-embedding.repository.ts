import { eq, isNull, sql } from 'drizzle-orm';
import { SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_DIMENSIONS } from '../constant/embedding-dimensions.constant';
import { EmbeddingQueryConfigInterface } from '../interface/embedding-query-config.interface';
import { Db } from '../service/db.service';
import { convertEmbeddingToJson } from '../util/convert-embedding-to-json.util';

import type { CategoryScoreResultInterface } from '../interface/category-score-result.interface';
import type { ReplaceEmbeddingTagsParamsInterface } from '../interface/replace-embedding-tags-params.interface';
import type { SimilarTagsParamsInterface } from '../interface/similar-tags-params.interface';
import type { TagScoreResultInterface } from '../interface/tag-score-result.interface';

export abstract class BaseEmbeddingRepository {
    readonly findSimilarCategories = Effect.fn('BaseEmbeddingRepository.findSimilarCategories')(function* (
        this: BaseEmbeddingRepository,
        ...[queryEmbedding, vecLimit, distanceThreshold, categoryLimit]: [Uint8Array, number, number, number]
    ) {
        return yield* Db.query(db =>
            db.$client.getAllAsync<CategoryScoreResultInterface>(this.queryConfig.similarCategoriesQuery, [
                convertEmbeddingToJson(queryEmbedding),
                vecLimit,
                distanceThreshold,
                categoryLimit
            ])
        );
    });

    readonly findSimilarTags = Effect.fn('BaseEmbeddingRepository.findSimilarTags')(function* (
        this: BaseEmbeddingRepository,
        queryEmbedding: Uint8Array,
        params: SimilarTagsParamsInterface
    ) {
        const { vecLimit, distanceThreshold, categoryId, tagLimit } = params;

        return yield* Db.query(db =>
            db.$client.getAllAsync<TagScoreResultInterface>(this.queryConfig.similarTagsQuery, [
                convertEmbeddingToJson(queryEmbedding),
                vecLimit,
                distanceThreshold,
                categoryId,
                tagLimit
            ])
        );
    });

    protected readonly countRows = Effect.fn('BaseEmbeddingRepository.countRows')(function* (
        table: SQLiteTable,
        deletedAtColumn: SQLiteColumn
    ) {
        const [result] = yield* Db.query(db =>
            db
                .select({ count: sql<number>`COUNT(*)` })
                .from(table)
                .where(isNull(deletedAtColumn))
        );

        return result.count;
    });

    protected readonly rebuildVec = Effect.fn('BaseEmbeddingRepository.rebuildVec')(function* (this: BaseEmbeddingRepository) {
        const { vecTableName, sourceTableName } = this.queryConfig;

        yield* Db.query(db => db.$client.runAsync(`DELETE FROM ${vecTableName}`, []));
        yield* Db.query(db =>
            db.$client.runAsync(
                `INSERT INTO ${vecTableName}(rowid, embedding) SELECT id, embedding FROM ${sourceTableName} WHERE deleted_at IS NULL`,
                []
            )
        );
    });

    protected readonly replaceEmbeddingTags = Effect.fn('BaseEmbeddingRepository.replaceEmbeddingTags')(function* (
        params: ReplaceEmbeddingTagsParamsInterface
    ) {
        const { tagTable, foreignKeyColumn, embeddingId, tagIds, createTagRow } = params;

        yield* Db.query(db => db.delete(tagTable).where(eq(foreignKeyColumn, embeddingId)));

        if (isNotEmptyArray(tagIds)) {
            yield* Db.query(db => db.insert(tagTable).values(tagIds.map(createTagRow)));
        }
    });

    protected readonly truncateWithTags = Effect.fn('BaseEmbeddingRepository.truncateWithTags')(function* (
        this: BaseEmbeddingRepository,
        tagTable: SQLiteTable,
        embeddingTable: SQLiteTable
    ) {
        const { vecTableName } = this.queryConfig;

        yield* Db.transaction(
            Effect.gen(function* () {
                yield* Db.query(db => db.delete(tagTable));
                yield* Db.query(db => db.delete(embeddingTable));
                yield* Db.query(db => db.$client.runAsync(`DELETE FROM ${vecTableName}`, []));
            })
        );
    });

    constructor(private readonly queryConfig: EmbeddingQueryConfigInterface) {}

    protected isValidDimensions(dimensions: number): boolean {
        return dimensions === EMBEDDING_DIMENSIONS;
    }
}
