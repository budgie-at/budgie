import { Db } from '@budgie/contracts';
import { eq, getTableName, isNull, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { EMBEDDING_DIMENSIONS } from '../constant/embedding.constant';

import { convertEmbeddingToJson } from './convert-embedding-to-json.util';

import type { CategoryScoreResultInterface } from '../interface/category-score-result.interface';
import type { EmbeddingQueryConfigInterface } from '../interface/embedding-query-config.interface';
import type { SimilarTagsParamsInterface } from '../interface/similar-tags-params.interface';
import type { TagScoreResultInterface } from '../interface/tag-score-result.interface';

export const makeEmbeddingRepository = <TUpsert extends { readonly dimensions: number }>(
    config: EmbeddingQueryConfigInterface<TUpsert>
) => ({
    findSimilarTags: (queryEmbedding: Uint8Array, { vecLimit, distanceThreshold, categoryId, tagLimit }: SimilarTagsParamsInterface) =>
        Db.query(db =>
            db.$client.unsafe<TagScoreResultInterface>(config.similarTagsQuery, [
                convertEmbeddingToJson(queryEmbedding),
                vecLimit,
                distanceThreshold,
                categoryId,
                tagLimit
            ])
        ),
    findSimilarCategories: (queryEmbedding: Uint8Array, vecLimit: number, distanceThreshold: number, categoryLimit: number) =>
        Db.query(db =>
            db.$client.unsafe<CategoryScoreResultInterface>(config.similarCategoriesQuery, [
                convertEmbeddingToJson(queryEmbedding),
                vecLimit,
                distanceThreshold,
                categoryLimit
            ])
        ),
    upsert: Effect.fn('EmbeddingRepository.upsert')(function* (params: TUpsert) {
        if (params.dimensions !== EMBEDDING_DIMENSIONS) {
            return null;
        }

        const [row] = yield* Db.query(db => config.upsertRow(db, params));

        yield* Db.query(db => db.$client.unsafe(`DELETE FROM ${config.vecTableName} WHERE rowid = ?`, [row.id]).raw);
        yield* Db.query(
            db =>
                db.$client.unsafe(
                    `INSERT INTO ${config.vecTableName}(rowid, embedding) SELECT id, embedding FROM ${getTableName(config.embeddingTable)} WHERE id = ?`,
                    [row.id]
                ).raw
        );

        return row.id;
    }),
    replaceTags: Effect.fn('EmbeddingRepository.replaceTags')(function* (embeddingId: number, tagIds: number[]) {
        yield* Db.query(db => db.delete(config.tagTable).where(eq(config.foreignKeyColumn, embeddingId)));

        if (isNotEmptyArray(tagIds)) {
            yield* Db.query(db => db.insert(config.tagTable).values(tagIds.map(tagId => config.createTagRow(embeddingId, tagId))));
        }
    }),
    countAll: () =>
        Db.query(db =>
            db
                .select({ count: sql<number>`COUNT(*)` })
                .from(config.embeddingTable)
                .where(isNull(config.deletedAtColumn))
        ).pipe(Effect.map(([result]) => result.count)),
    truncate: () =>
        Db.transaction(
            Effect.gen(function* () {
                yield* Db.query(db => db.delete(config.tagTable));
                yield* Db.query(db => db.delete(config.embeddingTable));
                yield* Db.query(db => db.$client.unsafe(`DELETE FROM ${config.vecTableName}`).raw);
            })
        )
});
