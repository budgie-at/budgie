import { count, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { TranslatableRepositoryBase } from '../../@generic/repository/translatable-repository.base';
import { Db } from '../../@generic/service/db.service';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TagCreateEntityInterface } from '../entity/tag-create-entity.interface';
import { TagUpdateEntityInterface } from '../entity/tag-update-entity.interface';
import { TagEntityTable } from '../table/tag-entity.table';

import type * as schema from '../../schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export class TagRepository extends TranslatableRepositoryBase {
    readonly updateById = Effect.fn('TagRepository.updateById')(function* (id: number, input: TagUpdateEntityInterface) {
        const newTitle = input.title;
        const titleChanged = isDefined(newTitle);

        const [tag] = yield* Db.query(db =>
            db
                .update(TagEntityTable)
                .set({
                    ...input,
                    ...(titleChanged && { titleSearch: newTitle.toLowerCase(), titleEn: null, titleTags: null, tagsGeneratedAt: null })
                })
                .where(eq(TagEntityTable.id, id))
                .returning()
        );

        return tag;
    });

    readonly reassignTransactions = Effect.fn('TagRepository.reassignTransactions')(function* (fromTagId: number, toTagId: number) {
        const transactionsWithFromTag = yield* Db.query(db =>
            db
                .select({ transactionId: TransactionTagsEntityTable.transactionId })
                .from(TransactionTagsEntityTable)
                .where(eq(TransactionTagsEntityTable.tagId, fromTagId))
        );

        if (isNotEmptyArray(transactionsWithFromTag)) {
            yield* Db.query(db =>
                db
                    .insert(TransactionTagsEntityTable)
                    .values(transactionsWithFromTag.map(row => ({ transactionId: row.transactionId, tagId: toTagId })))
                    .onConflictDoNothing()
            );
        }

        yield* Db.query(db => db.delete(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.tagId, fromTagId)));
    });

    constructor(private readonly db: ExpoSQLiteDatabase<typeof schema>) {
        super(TagEntityTable, {
            id: TagEntityTable.id,
            title: TagEntityTable.title,
            titleEn: TagEntityTable.titleEn,
            titleTags: TagEntityTable.titleTags,
            tagsGeneratedAt: TagEntityTable.tagsGeneratedAt,
            deletedAt: TagEntityTable.deletedAt
        });
    }

    readonly create = (input: TagCreateEntityInterface) =>
        Db.query(db =>
            db
                .insert(TagEntityTable)
                .values([{ ...input, titleSearch: input.title.toLowerCase() }])
                .returning()
        ).pipe(Effect.map(([tag]) => tag));

    readonly updateTranslation = (id: number, titleEn: string, titleTags: string) =>
        Db.query(db =>
            db.update(TagEntityTable).set({ titleEn, titleTags, tagsGeneratedAt: new Date() }).where(eq(TagEntityTable.id, id))
        ).pipe(Effect.asVoid);

    readonly clearTranslation = (id: number) =>
        Db.query(db =>
            db.update(TagEntityTable).set({ titleEn: null, titleTags: null, tagsGeneratedAt: null }).where(eq(TagEntityTable.id, id))
        );

    readonly deleteById = (id: number) => Db.query(db => db.delete(TagEntityTable).where(eq(TagEntityTable.id, id)));

    readonly countTransactions = (tagId: number) =>
        Db.query(db =>
            db.select({ count: count() }).from(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.tagId, tagId))
        ).pipe(Effect.map(([result]) => result.count));

    readonly truncate = () => Db.query(db => db.delete(TagEntityTable));

    findByIds(ids: number[]) {
        return this.db.query.TagEntityTable.findMany({
            where: inArray(TagEntityTable.id, ids)
        });
    }

    findBySearchQuery(search: string) {
        const trimmed = search.trim();
        if (!isNotEmptyString(trimmed)) {
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

    findAll() {
        return this.db.query.TagEntityTable.findMany();
    }

    findWithoutTags() {
        return this.db.query.TagEntityTable.findMany({
            where: isNull(TagEntityTable.tagsGeneratedAt)
        });
    }
}
