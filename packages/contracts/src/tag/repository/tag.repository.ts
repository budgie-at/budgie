import { count, eq, max } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { TRANSLATION_RESET } from '../../@generic/constant/translation-reset.constant';
import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { makeTranslatableRepository } from '../../@generic/utils/make-translatable-repository.util';
import { TRANSACTION_TAGS_PREFER_USER_SOURCE_CONFLICT } from '../../transaction-tags/constant/transaction-tags-prefer-user-source-conflict.constant';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TagCreateEntityInterface } from '../entity/tag-create-entity.interface';
import { TagUpdateEntityInterface } from '../entity/tag-update-entity.interface';
import { TagEntityTable } from '../table/tag-entity.table';

export class TagRepository extends Context.Service<TagRepository>()('@budgie/contracts/TagRepository', {
    make: Effect.succeed({
        ...makeTranslatableRepository(TagEntityTable),
        create: (input: TagCreateEntityInterface) =>
            Db.query(db =>
                db
                    .insert(TagEntityTable)
                    .values([{ ...input, titleSearch: input.title.toLowerCase() }])
                    .returning()
            ).pipe(Effect.map(([tag]) => tag)),
        updateById: (id: number, input: TagUpdateEntityInterface) =>
            Db.query(db =>
                db
                    .update(TagEntityTable)
                    .set({
                        ...input,
                        ...(isDefined(input.title) && {
                            titleSearch: input.title.toLowerCase(),
                            ...TRANSLATION_RESET
                        })
                    })
                    .where(eq(TagEntityTable.id, id))
                    .returning()
            ).pipe(Effect.map(([tag]) => tag)),
        reassignTransactions: Effect.fn('TagRepository.reassignTransactions')(function* (fromTagId: number, toTagId: number) {
            const transactionsWithFromTag = yield* Db.query(db =>
                db
                    .select({ transactionId: TransactionTagsEntityTable.transactionId, source: TransactionTagsEntityTable.source })
                    .from(TransactionTagsEntityTable)
                    .where(eq(TransactionTagsEntityTable.tagId, fromTagId))
            );

            if (isNotEmptyArray(transactionsWithFromTag)) {
                yield* Db.query(db =>
                    db
                        .insert(TransactionTagsEntityTable)
                        .values(
                            transactionsWithFromTag.map(row => ({ transactionId: row.transactionId, tagId: toTagId, source: row.source }))
                        )
                        .onConflictDoUpdate(TRANSACTION_TAGS_PREFER_USER_SOURCE_CONFLICT)
                );
            }

            yield* Db.query(db => db.delete(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.tagId, fromTagId)));
        }),
        deleteById: (id: number) => Db.query(db => db.delete(TagEntityTable).where(eq(TagEntityTable.id, id))).pipe(Effect.asVoid),
        countTransactions: (tagId: number) =>
            Db.query(db =>
                db.select({ count: count() }).from(TransactionTagsEntityTable).where(eq(TransactionTagsEntityTable.tagId, tagId))
            ).pipe(Effect.map(([result]) => result.count)),
        findUsage: () =>
            Db.query(db =>
                db
                    .select({
                        id: TransactionTagsEntityTable.tagId,
                        transactionCount: count(),
                        lastUsedAt: max(TransactionEntityTable.operatedAt)
                    })
                    .from(TransactionTagsEntityTable)
                    .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionTagsEntityTable.transactionId))
                    .where(transactionFilters.buildVisibleTransactionCondition())
                    .groupBy(TransactionTagsEntityTable.tagId)
            ),
        findByIds: (ids: number[]) => Db.query(db => db.query.TagEntityTable.findMany({ where: { id: { in: ids } } })),
        findBySearchQuery: (search: string) => {
            const pattern = `%${search.trim().toLowerCase()}%`;

            return Db.query(db =>
                db.query.TagEntityTable.findMany({
                    ...(isNotEmptyString(search.trim()) && {
                        where: {
                            OR: [
                                { titleSearch: { like: pattern } },
                                { RAW: (table, { like, sql }) => like(sql<string>`LOWER(COALESCE(${table.titleEn}, ''))`, pattern) },
                                { RAW: (table, { like, sql }) => like(sql<string>`LOWER(COALESCE(${table.titleTags}, ''))`, pattern) }
                            ]
                        }
                    })
                })
            );
        }
    })
}) {
    static readonly layer = Layer.effect(TagRepository, TagRepository.make);
}
