import { count, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';

import { isDefined } from '@rnw-community/shared';

import { TranslatableRepositoryBase } from '../../@generic/repository/translatable-repository.base';
import { DB } from '../../@generic/type/db.type';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TagCreateEntityInterface } from '../entity/tag-create-entity.interface';
import { TagUpdateEntityInterface } from '../entity/tag-update-entity.interface';
import { TagEntityTable } from '../table/tag-entity.table';

import type * as schema from '../../schema';
import type { TagEntityInterface } from '../entity/tag-entity.interface';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class TagRepository extends TranslatableRepositoryBase {
    constructor(db: ExpoSQLiteDatabase<typeof schema>) {
        super(db, TagEntityTable, {
            id: TagEntityTable.id,
            title: TagEntityTable.title,
            titleEn: TagEntityTable.titleEn,
            titleTags: TagEntityTable.titleTags,
            tagsGeneratedAt: TagEntityTable.tagsGeneratedAt,
            deletedAt: TagEntityTable.deletedAt
        });
    }

    findByIds(ids: number[]) {
        return this.db.query.TagEntityTable.findMany({
            where: inArray(TagEntityTable.id, ids)
        });
    }

    findBySearchQuery(search: string) {
        const trimmed = search.trim();
        if (trimmed === '') {
            return this.db.query.TagEntityTable.findMany();
        }

        const pattern = `%${trimmed.toLowerCase()}%`;

        return this.db.query.TagEntityTable.findMany({
            where: or(
                like(TagEntityTable.titleSearch, pattern),
                like(sql<string>`LOWER(COALESCE(${TagEntityTable.titleEn}, ''))`, pattern),
                like(sql<string>`LOWER(COALESCE(${TagEntityTable.titleTags}, ''))`, pattern)
            )
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
        const newTitle = input.title;
        const titleChanged = isDefined(newTitle);

        const [tag] = await this.db
            .update(TagEntityTable)
            .set({
                ...input,
                ...(titleChanged && { titleSearch: newTitle.toLowerCase(), titleEn: null, titleTags: null, tagsGeneratedAt: null })
            })
            .where(eq(TagEntityTable.id, id))
            .returning();

        return tag;
    }

    findAll() {
        return this.db.query.TagEntityTable.findMany();
    }

    findWithoutTags() {
        return this.db.query.TagEntityTable.findMany({
            where: isNull(TagEntityTable.tagsGeneratedAt)
        });
    }

    async updateTranslation(id: number, titleEn: string, titleTags: string): Promise<void> {
        await this.db.update(TagEntityTable).set({ titleEn, titleTags, tagsGeneratedAt: new Date() }).where(eq(TagEntityTable.id, id));
    }

    async clearTranslation(id: number): Promise<void> {
        await this.db
            .update(TagEntityTable)
            .set({ titleEn: null, titleTags: null, tagsGeneratedAt: null })
            .where(eq(TagEntityTable.id, id));
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

    async truncate(tx?: DB): Promise<void> {
        await (tx ?? this.db).delete(TagEntityTable);
    }
}
