import { count, eq, inArray, like } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { TX } from '../../@generic/type/db.type';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TagCreateEntityInterface } from '../entity/tag-create-entity.interface';
import { TagUpdateEntityInterface } from '../entity/tag-update-entity.interface';
import { TagEntityTable } from '../table/tag-entity.table';

import type * as schema from '../../schema';
import type { TagEntityInterface } from '../entity/tag-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class TagRepository {
    constructor(private db: ExpoSQLiteDatabase<typeof schema>) {}

    findByIds(ids: number[]) {
        return this.db.query.TagEntityTable.findMany({
            where: inArray(TagEntityTable.id, ids)
        });
    }

    findBySearchQuery(search: string) {
        return this.db.query.TagEntityTable.findMany({
            where: like(TagEntityTable.titleSearch, `%${search.toLowerCase()}%`)
        });
    }

    count() {
        return this.db.select({ count: count() }).from(TagEntityTable);
    }

    async create(input: TagCreateEntityInterface): Promise<TagEntityInterface> {
        const [tag] = await this.db
            .insert(TagEntityTable)
            .values([{ ...input, titleSearch: input.title.toLowerCase() }])
            .returning();

        return tag;
    }

    async updateById(id: number, input: TagUpdateEntityInterface): Promise<TagEntityInterface> {
        const [tag] = await this.db
            .update(TagEntityTable)
            .set({ ...input, ...(isDefined(input.title) && { titleSearch: input.title.toLowerCase() }) })
            .where(eq(TagEntityTable.id, id))
            .returning();

        return tag;
    }

    async deleteById(id: number): Promise<void> {
        await this.db.delete(TagEntityTable).where(eq(TagEntityTable.id, id));
    }

    async countTransactions(tagId: number): Promise<number> {
        const [result] = await this.db
            .select({ count: count() })
            .from(TransactionTagsEntityTable)
            .where(eq(TransactionTagsEntityTable.tagId, tagId));

        return result.count;
    }

    async reassignTransactions(fromTagId: number, toTagId: number): Promise<void> {
        const transactionsWithFromTag = await this.db
            .select({ transactionId: TransactionTagsEntityTable.transactionId })
            .from(TransactionTagsEntityTable)
            .where(eq(TransactionTagsEntityTable.tagId, fromTagId));

        if (transactionsWithFromTag.length > 0) {
            await this.db
                .insert(TransactionTagsEntityTable)
                .values(transactionsWithFromTag.map(row => ({ transactionId: row.transactionId, tagId: toTagId })))
                .onConflictDoNothing();
        }

        await this.db.delete(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.tagId, fromTagId));
    }

    async findByTitle(title: string): Promise<TagEntityInterface | undefined> {
        return this.db.query.TagEntityTable.findFirst({
            where: eq(TagEntityTable.titleSearch, title.toLowerCase())
        });
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(TagEntityTable);
    }
}
