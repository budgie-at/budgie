import { and, count, desc, eq, inArray, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DB } from '../../@generic/type/db.type';
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

const hasEmbeddableContext = or(
    ne(TransactionEntityTable.title, ''),
    ne(TransactionEntityTable.comment, ''),
    isNotNull(MccCategoryEntityTable.fullDescription)
);

export class TitleEmbeddingRepository {
    constructor(private readonly db: DB) {}

    findSimilarContexts(queryEmbedding: Uint8Array, limit: number): EmbeddingContextResultInterface[] {
        return this.db.all<VecSearchResultInterface>(sql`
            SELECT te.context, te.title
            FROM (SELECT rowid, distance FROM title_embedding_vec WHERE embedding MATCH ${queryEmbedding} ORDER BY distance LIMIT ${limit}) vec
            JOIN title_embeddings te ON te.id = vec.rowid
            WHERE te.deleted_at IS NULL
        `);
    }

    findSimilarTitlesByContexts(contextEmbeddings: { context: string; embedding: Uint8Array }[], limit: number): string[] {
        const titleSet = new Set<string>();

        for (const { context, embedding } of contextEmbeddings) {
            const results = this.db.all<VecSearchResultInterface>(sql`
                SELECT te.context, te.title
                FROM (SELECT rowid, distance FROM title_embedding_vec WHERE embedding MATCH ${embedding} ORDER BY distance LIMIT ${limit}) vec
                JOIN title_embeddings te ON te.id = vec.rowid
                WHERE te.deleted_at IS NULL AND te.context != ${context}
            `);

            for (const row of results) {
                titleSet.add(row.title);
            }
        }

        return [...titleSet];
    }

    async findEmbeddingByContext(context: string): Promise<Uint8Array | null> {
        const results = await this.db
            .select({ embedding: TitleEmbeddingEntityTable.embedding })
            .from(TitleEmbeddingEntityTable)
            .where(and(eq(TitleEmbeddingEntityTable.context, context), isNull(TitleEmbeddingEntityTable.deletedAt)))
            .limit(1);

        return isNotEmptyArray(results) ? results[0].embedding : null;
    }

    async upsert(title: string, context: string, embedding: Uint8Array, dimensions: number): Promise<void> {
        const [row] = await this.db
            .insert(TitleEmbeddingEntityTable)
            .values({ title, context, embedding, dimensions })
            .onConflictDoUpdate({
                target: TitleEmbeddingEntityTable.context,
                set: { title, embedding, dimensions, updatedAt: new Date() }
            })
            .returning({ id: TitleEmbeddingEntityTable.id });

        this.db.run(sql`INSERT OR REPLACE INTO title_embedding_vec(rowid, embedding) VALUES (${row.id}, ${embedding})`);
    }

    async countAll(): Promise<number> {
        const [result] = await this.db
            .select({ count: count() })
            .from(TitleEmbeddingEntityTable)
            .where(isNull(TitleEmbeddingEntityTable.deletedAt));

        return result.count;
    }

    /* jscpd:ignore-start -- Same join/group pattern as findTransactionData for context counting */
    async countDistinctTransactionContexts(): Promise<number> {
        const rows = await this.db
            .select({ _: sql<number>`1` })
            .from(TransactionEntityTable)
            .leftJoin(
                TransactionEntryEntityTable,
                and(eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id), isNull(TransactionEntryEntityTable.deletedAt))
            )
            .leftJoin(MccCategoryEntityTable, eq(MccCategoryEntityTable.id, TransactionEntryEntityTable.mccCategoryId))
            .where(and(isNull(TransactionEntityTable.deletedAt), hasEmbeddableContext))
            .groupBy(TransactionEntityTable.title, TransactionEntityTable.comment, MccCategoryEntityTable.fullDescription);

        return rows.length;
    }
    /* jscpd:ignore-end */

    async findAllContexts(): Promise<string[]> {
        const results = await this.db
            .select({ context: TitleEmbeddingEntityTable.context })
            .from(TitleEmbeddingEntityTable)
            .where(isNull(TitleEmbeddingEntityTable.deletedAt));

        return results.map(row => row.context);
    }

    async findTransactionData(limit: number, offset = 0): Promise<UnembeddedTransactionDataInterface[]> {
        const results = await this.db
            .select({
                title: TransactionEntityTable.title,
                comment: TransactionEntityTable.comment,
                mccFullDescription: MccCategoryEntityTable.fullDescription,
                categoryTitleEn: sql<string | null>`MAX(COALESCE(${CategoryEntityTable.titleEn}, ${CategoryEntityTable.title}))`,
                tagTitlesEn: sql<string | null>`GROUP_CONCAT(DISTINCT COALESCE(${TagEntityTable.titleEn}, ${TagEntityTable.title}))`
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
            .offset(offset);

        return results.map(row => ({
            title: row.title,
            comment: row.comment,
            mccFullDescription: row.mccFullDescription ?? null,
            categoryTitleEn: row.categoryTitleEn ?? null,
            tagTitlesEn: row.tagTitlesEn ?? null
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

    async truncate(): Promise<void> {
        await this.db.delete(TitleEmbeddingEntityTable);
        this.db.run(sql`DELETE FROM title_embedding_vec`);
    }
}
