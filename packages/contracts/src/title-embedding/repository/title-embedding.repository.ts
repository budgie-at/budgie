import { and, count, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DB } from '../../@generic/type/db.type';
import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { EmbeddingContextResultInterface } from '../interface/embedding-context-result.interface';
import { TitleEmbeddingEntityInterface } from '../interface/title-embedding-entity.interface';
import { UnembeddedTransactionDataInterface } from '../interface/unembedded-transaction-data.interface';
import { TitleEmbeddingEntityTable } from '../table/title-embedding-entity.table';

export class TitleEmbeddingRepository {
    constructor(private readonly db: DB) {}

    async findAll(): Promise<TitleEmbeddingEntityInterface[]> {
        return this.db.select().from(TitleEmbeddingEntityTable).where(isNull(TitleEmbeddingEntityTable.deletedAt));
    }

    async upsert(title: string, context: string, embedding: Uint8Array, dimensions: number): Promise<void> {
        await this.db
            .insert(TitleEmbeddingEntityTable)
            .values({ title, context, embedding, dimensions })
            .onConflictDoUpdate({
                target: TitleEmbeddingEntityTable.context,
                set: { title, embedding, dimensions, updatedAt: new Date() }
            });
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
            .where(isNull(TransactionEntityTable.deletedAt))
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
                mccFullDescription: MccCategoryEntityTable.fullDescription
            })
            .from(TransactionEntityTable)
            .leftJoin(
                TransactionEntryEntityTable,
                and(eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id), isNull(TransactionEntryEntityTable.deletedAt))
            )
            .leftJoin(MccCategoryEntityTable, eq(MccCategoryEntityTable.id, TransactionEntryEntityTable.mccCategoryId))
            .where(isNull(TransactionEntityTable.deletedAt))
            .groupBy(TransactionEntityTable.title, TransactionEntityTable.comment, MccCategoryEntityTable.fullDescription)
            .orderBy(desc(sql`MAX(${TransactionEntityTable.operatedAt})`))
            .limit(limit)
            .offset(offset);

        return results.map(row => ({
            title: row.title,
            comment: row.comment,
            mccFullDescription: row.mccFullDescription ?? null
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
    }
}
