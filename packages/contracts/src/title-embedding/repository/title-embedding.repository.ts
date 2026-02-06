import { SQL, and, count, desc, isNull, ne, notInArray, sql } from 'drizzle-orm';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DB } from '../../@generic/type/db.type';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TitleEmbeddingEntityInterface } from '../interface/title-embedding-entity.interface';
import { TitleEmbeddingEntityTable } from '../table/title-embedding-entity.table';

export class TitleEmbeddingRepository {
    constructor(private readonly db: DB) {}

    async findAll(): Promise<TitleEmbeddingEntityInterface[]> {
        return this.db.select().from(TitleEmbeddingEntityTable).where(isNull(TitleEmbeddingEntityTable.deletedAt));
    }

    async upsert(title: string, embedding: Buffer, dimensions: number): Promise<void> {
        await this.db
            .insert(TitleEmbeddingEntityTable)
            .values({ title, embedding, dimensions })
            .onConflictDoUpdate({
                target: TitleEmbeddingEntityTable.title,
                set: { embedding, dimensions, updatedAt: new Date() }
            });
    }

    async countAll(): Promise<number> {
        const [result] = await this.db
            .select({ count: count() })
            .from(TitleEmbeddingEntityTable)
            .where(isNull(TitleEmbeddingEntityTable.deletedAt));

        return result.count;
    }

    async countDistinctTransactionTitles(): Promise<number> {
        const [result] = await this.db
            .select({ count: sql<number>`COUNT(DISTINCT ${TransactionEntityTable.title})` })
            .from(TransactionEntityTable)
            .where(isNull(TransactionEntityTable.deletedAt));

        return result.count;
    }

    async findUnembeddedTitles(limit: number): Promise<string[]> {
        const embeddedTitles = await this.db
            .select({ title: TitleEmbeddingEntityTable.title })
            .from(TitleEmbeddingEntityTable)
            .where(isNull(TitleEmbeddingEntityTable.deletedAt));

        const embeddedTitleList = embeddedTitles.map(row => row.title);

        const conditions: SQL[] = [isNull(TransactionEntityTable.deletedAt), ne(TransactionEntityTable.title, '')];

        if (isNotEmptyArray(embeddedTitleList)) {
            conditions.push(notInArray(TransactionEntityTable.title, embeddedTitleList));
        }

        const results = await this.db
            .selectDistinct({ title: TransactionEntityTable.title })
            .from(TransactionEntityTable)
            .where(and(...conditions))
            .limit(limit);

        return results.map(row => row.title);
    }

    async findRecentTitles(limit: number): Promise<string[]> {
        const results = await this.db
            .select({ title: TransactionEntityTable.title })
            .from(TransactionEntityTable)
            .where(and(isNull(TransactionEntityTable.deletedAt), ne(TransactionEntityTable.title, '')))
            .groupBy(TransactionEntityTable.title)
            .orderBy(desc(sql`MAX(${TransactionEntityTable.operatedAt})`))
            .limit(limit);

        return results.map(row => row.title);
    }

    async truncate(): Promise<void> {
        await this.db.delete(TitleEmbeddingEntityTable);
    }
}
