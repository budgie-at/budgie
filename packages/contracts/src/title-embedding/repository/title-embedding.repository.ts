import { and, count, desc, eq, inArray, isNotNull, isNull, lt, ne, or, sql } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { DB, RawDb } from '../../@generic/type/db.type';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { EmbeddingContextResultInterface } from '../interface/embedding-context-result.interface';
import { UnembeddedTransactionDataInterface } from '../interface/unembedded-transaction-data.interface';
import { VecSearchResultInterface } from '../interface/vec-search-result.interface';
import { TitleEmbeddingEntityTable } from '../table/title-embedding-entity.table';

const EMBEDDING_DIMENSIONS = 1536;

const SIMILAR_CONTEXTS_QUERY = `
    SELECT te.context, te.title
    FROM (SELECT rowid, distance FROM title_embedding_vec WHERE embedding MATCH ? ORDER BY distance LIMIT ?) vec
    JOIN title_embeddings te ON te.id = vec.rowid
    WHERE te.deleted_at IS NULL
`;

const SIMILAR_TITLES_BY_CONTEXT_QUERY = `
    SELECT te.context, te.title
    FROM (SELECT rowid, distance FROM title_embedding_vec WHERE embedding MATCH ? ORDER BY distance LIMIT ?) vec
    JOIN title_embeddings te ON te.id = vec.rowid
    WHERE te.deleted_at IS NULL AND te.context != ?
`;

const microPause = (): Promise<void> =>
    new Promise(resolve => {
        setTimeout(resolve, 0);
    });

const hasEmbeddableContext = or(
    ne(TransactionEntityTable.title, ''),
    ne(TransactionEntityTable.comment, ''),
    isNotNull(MccCategoryEntityTable.fullDescription)
);

export class TitleEmbeddingRepository {
    constructor(
        private readonly db: DB,
        private readonly rawDb: RawDb
    ) {}

    async findSimilarContexts(queryEmbedding: Uint8Array, limit: number): Promise<EmbeddingContextResultInterface[]> {
        return this.rawDb.getAllAsync<VecSearchResultInterface>(SIMILAR_CONTEXTS_QUERY, [queryEmbedding, limit]);
    }

    async findSimilarTitlesByContexts(contextEmbeddings: { context: string; embedding: Uint8Array }[], limit: number): Promise<string[]> {
        const titleSet = new Set<string>();

        /* eslint-disable no-await-in-loop -- Sequential execution with UI yielding between vector searches */
        for (const { context, embedding } of contextEmbeddings) {
            const results = await this.rawDb.getAllAsync<VecSearchResultInterface>(SIMILAR_TITLES_BY_CONTEXT_QUERY, [
                embedding,
                limit,
                context
            ]);

            for (const row of results) {
                titleSet.add(row.title);
            }

            await microPause();
        }
        /* eslint-enable no-await-in-loop */

        return [...titleSet];
    }

    async findEmbeddingsByContexts(contexts: string[]): Promise<Map<string, Uint8Array>> {
        const resultMap = new Map<string, Uint8Array>();

        if (!isNotEmptyArray(contexts)) {
            return resultMap;
        }

        const results = await this.db
            .select({
                context: TitleEmbeddingEntityTable.context,
                embedding: TitleEmbeddingEntityTable.embedding
            })
            .from(TitleEmbeddingEntityTable)
            .where(and(inArray(TitleEmbeddingEntityTable.context, contexts), isNull(TitleEmbeddingEntityTable.deletedAt)));

        for (const row of results) {
            resultMap.set(row.context, row.embedding);
        }

        return resultMap;
    }

    async upsert(title: string, context: string, embedding: Uint8Array, dimensions: number): Promise<void> {
        if (dimensions !== EMBEDDING_DIMENSIONS) {
            return;
        }

        await this.db.transaction(async tx => {
            const [row] = await tx
                .insert(TitleEmbeddingEntityTable)
                .values({ title, context, embedding, dimensions })
                .onConflictDoUpdate({
                    target: TitleEmbeddingEntityTable.context,
                    set: { title, embedding, dimensions, updatedAt: new Date() }
                })
                .returning({ id: TitleEmbeddingEntityTable.id });

            tx.run(sql`INSERT OR REPLACE INTO title_embedding_vec(rowid, embedding) VALUES (${row.id}, ${embedding})`);
        });
    }

    async countAll(): Promise<number> {
        const [result] = await this.db
            .select({ count: count() })
            .from(TitleEmbeddingEntityTable)
            .where(isNull(TitleEmbeddingEntityTable.deletedAt));

        return result.count;
    }

    async countDistinctTransactionContexts(): Promise<number> {
        const [result] = this.db.all<{ count: number }>(sql`
            SELECT COUNT(*) as count FROM (
                SELECT 1
                FROM ${TransactionEntityTable}
                LEFT JOIN ${TransactionEntryEntityTable}
                    ON ${TransactionEntryEntityTable.transactionId} = ${TransactionEntityTable.id}
                    AND ${TransactionEntryEntityTable.deletedAt} IS NULL
                LEFT JOIN ${MccCategoryEntityTable}
                    ON ${MccCategoryEntityTable.id} = ${TransactionEntryEntityTable.mccCategoryId}
                WHERE ${TransactionEntityTable.deletedAt} IS NULL
                    AND (${TransactionEntityTable.title} != '' OR ${TransactionEntityTable.comment} != '' OR ${MccCategoryEntityTable.fullDescription} IS NOT NULL)
                GROUP BY ${TransactionEntityTable.title}, ${TransactionEntityTable.comment}, ${MccCategoryEntityTable.fullDescription}
            )
        `);

        return result.count;
    }

    async findAllContexts(): Promise<string[]> {
        const results = await this.db
            .select({ context: TitleEmbeddingEntityTable.context })
            .from(TitleEmbeddingEntityTable)
            .where(isNull(TitleEmbeddingEntityTable.deletedAt));

        return results.map(row => row.context);
    }

    async findTransactionData(limit: number, cursor?: number): Promise<UnembeddedTransactionDataInterface[]> {
        const cursorCondition = isDefined(cursor) ? lt(sql`MAX(${TransactionEntityTable.operatedAt})`, cursor) : null;

        let query = this.db
            .select({
                title: TransactionEntityTable.title,
                comment: TransactionEntityTable.comment,
                mccFullDescription: MccCategoryEntityTable.fullDescription,
                categoryTitleEn: sql<string | null>`MAX(COALESCE(${CategoryEntityTable.titleEn}, ${CategoryEntityTable.title}))`,
                tagTitlesEn: sql<string | null>`GROUP_CONCAT(DISTINCT COALESCE(${TagEntityTable.titleEn}, ${TagEntityTable.title}))`,
                maxOperatedAt: sql<number>`MAX(${TransactionEntityTable.operatedAt})`.as('maxOperatedAt')
            })
            .from(TransactionEntityTable)
            .leftJoin(
                TransactionEntryEntityTable,
                and(eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id), isNull(TransactionEntryEntityTable.deletedAt))
            )
            .leftJoin(MccCategoryEntityTable, eq(MccCategoryEntityTable.id, TransactionEntryEntityTable.mccCategoryId))
            .leftJoin(CategoryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
            .leftJoin(TransactionTagsEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
            .leftJoin(TagEntityTable, eq(TagEntityTable.id, TransactionTagsEntityTable.tagId))
            .where(and(isNull(TransactionEntityTable.deletedAt), hasEmbeddableContext))
            .groupBy(TransactionEntityTable.title, TransactionEntityTable.comment, MccCategoryEntityTable.fullDescription)
            .orderBy(desc(sql`MAX(${TransactionEntityTable.operatedAt})`))
            .limit(limit)
            .$dynamic();

        if (isDefined(cursorCondition)) {
            query = query.having(cursorCondition);
        }

        const results = await query;

        return results.map(row => ({
            title: row.title,
            comment: row.comment,
            mccFullDescription: row.mccFullDescription ?? null,
            categoryTitleEn: row.categoryTitleEn ?? null,
            tagTitlesEn: row.tagTitlesEn ?? null,
            maxOperatedAt: row.maxOperatedAt
        }));
    }

    async findRecentContexts(limit: number): Promise<EmbeddingContextResultInterface[]> {
        const results = await this.db
            .select({
                title: TitleEmbeddingEntityTable.title,
                context: TitleEmbeddingEntityTable.context
            })
            .from(TitleEmbeddingEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.title, TitleEmbeddingEntityTable.title))
            .where(and(isNull(TitleEmbeddingEntityTable.deletedAt), isNull(TransactionEntityTable.deletedAt)))
            .groupBy(TitleEmbeddingEntityTable.context, TitleEmbeddingEntityTable.title)
            .orderBy(desc(sql`MAX(${TransactionEntityTable.operatedAt})`))
            .limit(limit);

        return results;
    }

    async findCategoriesByContexts(contexts: string[]): Promise<{ categoryId: number; count: number }[]> {
        if (!isNotEmptyArray(contexts)) {
            return [];
        }

        const titles = await this.db
            .select({ title: TitleEmbeddingEntityTable.title, context: TitleEmbeddingEntityTable.context })
            .from(TitleEmbeddingEntityTable)
            .where(and(inArray(TitleEmbeddingEntityTable.context, contexts), isNull(TitleEmbeddingEntityTable.deletedAt)));

        const titleStrings = titles.map(row => row.title);

        const matchingTransactions = await this.db
            .select({
                title: TransactionEntityTable.title,
                categoryId: TransactionEntryEntityTable.categoryId,
                entryDeleted: TransactionEntryEntityTable.deletedAt,
                txDeleted: TransactionEntityTable.deletedAt
            })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(inArray(TransactionEntityTable.title, titleStrings))
            .limit(20);

        // eslint-disable-next-line no-console
        console.log('[findCategoriesByContexts] debug', {
            inputContexts: contexts.length,
            embeddingTitles: titleStrings.slice(0, 5),
            matchingTxSample: matchingTransactions.slice(0, 10).map(row => ({
                title: row.title,
                categoryId: row.categoryId,
                entryDeleted: row.entryDeleted,
                txDeleted: row.txDeleted
            }))
        });

        return this.db
            .select({
                categoryId: sql<number>`${TransactionEntryEntityTable.categoryId}`,
                count: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})`
            })
            .from(TitleEmbeddingEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.title, TitleEmbeddingEntityTable.title))
            .innerJoin(
                TransactionEntryEntityTable,
                and(eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id), isNull(TransactionEntryEntityTable.deletedAt))
            )
            .where(
                and(
                    inArray(TitleEmbeddingEntityTable.context, contexts),
                    isNull(TitleEmbeddingEntityTable.deletedAt),
                    isNull(TransactionEntityTable.deletedAt),
                    isNotNull(TransactionEntryEntityTable.categoryId)
                )
            )
            .groupBy(TransactionEntryEntityTable.categoryId)
            .orderBy(desc(sql`COUNT(DISTINCT ${TransactionEntityTable.id})`));
    }

    async findTagsByContexts(contexts: string[]): Promise<{ tagId: number; count: number }[]> {
        if (!isNotEmptyArray(contexts)) {
            return [];
        }

        return this.db
            .select({
                tagId: sql<number>`${TransactionTagsEntityTable.tagId}`,
                count: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.id})`
            })
            .from(TitleEmbeddingEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.title, TitleEmbeddingEntityTable.title))
            .innerJoin(TransactionTagsEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
            .where(
                and(
                    inArray(TitleEmbeddingEntityTable.context, contexts),
                    isNull(TitleEmbeddingEntityTable.deletedAt),
                    isNull(TransactionEntityTable.deletedAt)
                )
            )
            .groupBy(TransactionTagsEntityTable.tagId)
            .orderBy(desc(sql`COUNT(DISTINCT ${TransactionEntityTable.id})`));
    }

    async softDeleteByTitle(title: string): Promise<void> {
        await this.db.transaction(async tx => {
            const rows = await tx
                .select({ id: TitleEmbeddingEntityTable.id })
                .from(TitleEmbeddingEntityTable)
                .where(and(eq(TitleEmbeddingEntityTable.title, title), isNull(TitleEmbeddingEntityTable.deletedAt)));

            for (const row of rows) {
                tx.run(sql`DELETE FROM title_embedding_vec WHERE rowid = ${row.id}`);
            }

            await tx
                .update(TitleEmbeddingEntityTable)
                .set({ deletedAt: new Date() })
                .where(and(eq(TitleEmbeddingEntityTable.title, title), isNull(TitleEmbeddingEntityTable.deletedAt)));
        });
    }

    async truncate(): Promise<void> {
        await this.db.transaction(async tx => {
            await tx.delete(TitleEmbeddingEntityTable);
            tx.run(sql`DELETE FROM title_embedding_vec`);
        });
    }
}
