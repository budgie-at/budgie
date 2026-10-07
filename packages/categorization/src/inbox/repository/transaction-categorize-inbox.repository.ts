import {
    AccountEntityTable,
    BaseTransactionFilterRepository,
    CategoryEntityTable,
    CategorySourceEnum,
    Db,
    InstrumentEntityTable,
    MccCategoryEntityTable,
    TagSourceEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTagsEntityTable,
    insertTransactionTag
} from '@budgie/contracts';
import { and, desc, eq, inArray, isNotNull, isNull, notInArray, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyString } from '@rnw-community/shared';

import type { DB, DbError, TransactionFilterInterface, TransactionTagsEntityInterface } from '@budgie/contracts';
import type { SQL } from 'drizzle-orm';

export class TransactionCategorizeInboxRepository extends Context.Service<TransactionCategorizeInboxRepository>()(
    '@budgie/categorization/TransactionCategorizeInboxRepository',
    {
        make: Effect.sync(() => {
            const transactionFilters = new BaseTransactionFilterRepository();
            const writeChunkSize = 500;

            const writeInChunks = Effect.fnUntraced(function* (
                transactionIds: number[],
                writeChunk: (chunk: number[]) => Effect.Effect<Pick<TransactionTagsEntityInterface, 'transactionId'>[], DbError, Db>
            ) {
                const writtenTransactionIds = new Set<number>();

                for (let start = 0; start < transactionIds.length; start += writeChunkSize) {
                    const rows = yield* writeChunk(transactionIds.slice(start, start + writeChunkSize));

                    for (const row of rows) {
                        writtenTransactionIds.add(row.transactionId);
                    }
                }

                return [...writtenTransactionIds];
            });

            const buildAssignableEntryCondition = (transactionIds: number[]) =>
                and(
                    inArray(TransactionEntryEntityTable.transactionId, transactionIds),
                    transactionFilters.buildCategorizableEntryCondition()
                );

            const buildInboxRowsWhere = (filters: TransactionFilterInterface, entryCondition: SQL | undefined) =>
                and(
                    transactionFilters.buildFilterWhere(filters),
                    transactionFilters.buildCategorizableTypeCondition(filters.types),
                    entryCondition
                );

            const buildEvidenceWhere = (labelConditions: SQL[]) =>
                and(
                    ...labelConditions,
                    transactionFilters.buildCategorizableEntryCondition(),
                    transactionFilters.buildVisibleTransactionCondition(),
                    transactionFilters.buildCategorizableTypeCondition(null)
                );

            const buildEvidenceGroupBy = () => [
                TransactionEntityTable.title,
                TransactionEntityTable.type,
                TransactionEntryEntityTable.mccCategoryId
            ];

            const selectInboxRows = (where: SQL | undefined) =>
                Db.query(db =>
                    db
                        .select({
                            transactionId: TransactionEntityTable.id,
                            type: TransactionEntityTable.type,
                            title: TransactionEntityTable.title,
                            operatedAt: TransactionEntityTable.operatedAt,
                            amount: TransactionEntryEntityTable.amount,
                            baseAmount: TransactionEntryEntityTable.baseAmount,
                            baseInstrumentId: TransactionEntryEntityTable.baseInstrumentId,
                            mccCategoryId: TransactionEntryEntityTable.mccCategoryId,
                            categoryId: TransactionEntryEntityTable.categoryId,
                            tagIds: sql<string>`(SELECT COALESCE(group_concat(${TransactionTagsEntityTable.tagId}), '') FROM ${TransactionTagsEntityTable} WHERE ${TransactionTagsEntityTable.transactionId} = ${TransactionEntityTable.id})`.mapWith(
                                (tagIds: string) => tagIds.split(',').filter(isNotEmptyString).map(Number)
                            ),
                            mcc: MccCategoryEntityTable.mcc,
                            instrumentSymbol: InstrumentEntityTable.symbol
                        })
                        .from(TransactionEntryEntityTable)
                        .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
                        .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
                        .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
                        .leftJoin(MccCategoryEntityTable, eq(MccCategoryEntityTable.id, TransactionEntryEntityTable.mccCategoryId))
                        .where(where)
                        .orderBy(desc(TransactionEntityTable.operatedAt))
                );

            const selectEvidence = (db: DB, labelId: SQL<number>) =>
                db
                    .select({
                        title: TransactionEntityTable.title,
                        type: TransactionEntityTable.type,
                        mccCategoryId: TransactionEntryEntityTable.mccCategoryId,
                        labelId,
                        count: sql<number>`COUNT(*)`
                    })
                    .from(TransactionEntryEntityTable)
                    .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId));

            return {
                updateUncategorizedCategoryByTransactionIds: Effect.fn(
                    'TransactionCategorizeInboxRepository.updateUncategorizedCategoryByTransactionIds'
                )(function* (transactionIds: number[], categoryId: number, categorySource: CategorySourceEnum) {
                    return yield* writeInChunks(transactionIds, chunk =>
                        Db.query(db =>
                            db
                                .update(TransactionEntryEntityTable)
                                .set({ categoryId, categorySource })
                                .where(and(buildAssignableEntryCondition(chunk), isNull(TransactionEntryEntityTable.categoryId)))
                                .returning({ transactionId: TransactionEntryEntityTable.transactionId })
                        )
                    );
                }),
                clearCategoryByTransactionIds: Effect.fn('TransactionCategorizeInboxRepository.clearCategoryByTransactionIds')(function* (
                    transactionIds: number[],
                    categoryId: number
                ) {
                    return yield* writeInChunks(transactionIds, chunk =>
                        Db.query(db =>
                            db
                                .update(TransactionEntryEntityTable)
                                .set({ categoryId: null, categorySource: CategorySourceEnum.USER })
                                .where(and(buildAssignableEntryCondition(chunk), eq(TransactionEntryEntityTable.categoryId, categoryId)))
                                .returning({ transactionId: TransactionEntryEntityTable.transactionId })
                        )
                    );
                }),
                addTagByTransactionIds: Effect.fn('TransactionCategorizeInboxRepository.addTagByTransactionIds')(function* (
                    transactionIds: number[],
                    tagId: number,
                    source: TagSourceEnum
                ) {
                    return yield* writeInChunks(transactionIds, chunk =>
                        Db.query(db =>
                            insertTransactionTag(
                                db,
                                tagId,
                                and(
                                    inArray(TransactionEntityTable.id, chunk),
                                    transactionFilters.buildVisibleTransactionCondition(),
                                    transactionFilters.buildCategorizableTypeCondition(null)
                                ),
                                source
                            )
                        )
                    );
                }),
                removeTagByTransactionIds: Effect.fn('TransactionCategorizeInboxRepository.removeTagByTransactionIds')(function* (
                    transactionIds: number[],
                    tagId: number
                ) {
                    return yield* writeInChunks(transactionIds, chunk =>
                        Db.query(db =>
                            db
                                .delete(TransactionTagsEntityTable)
                                .where(
                                    and(
                                        eq(TransactionTagsEntityTable.tagId, tagId),
                                        inArray(TransactionTagsEntityTable.transactionId, chunk)
                                    )
                                )
                                .returning({ transactionId: TransactionTagsEntityTable.transactionId })
                        )
                    );
                }),
                findUncategorizedRows: (filters: TransactionFilterInterface) =>
                    selectInboxRows(
                        buildInboxRowsWhere({ ...filters, categoryIds: null }, transactionFilters.buildUncategorizedEntryCondition())
                    ),
                findUntaggedRows: (filters: TransactionFilterInterface) =>
                    selectInboxRows(
                        buildInboxRowsWhere(
                            { ...filters, tagIds: [] },
                            and(
                                transactionFilters.buildCategorizableEntryCondition(),
                                transactionFilters.buildNonDebtAccountCondition(),
                                sql`LENGTH(TRIM(${TransactionEntityTable.title})) > 0`
                            )
                        )
                    ),
                findCategoryEvidence: () =>
                    Db.query(db =>
                        selectEvidence(db, sql<number>`${TransactionEntryEntityTable.categoryId}`.mapWith(Number))
                            .innerJoin(CategoryEntityTable, eq(CategoryEntityTable.id, TransactionEntryEntityTable.categoryId))
                            .where(
                                buildEvidenceWhere([
                                    isNotNull(TransactionEntryEntityTable.categoryId),
                                    notInArray(TransactionEntryEntityTable.categorySource, [
                                        CategorySourceEnum.MCC_DEFAULT,
                                        CategorySourceEnum.INBOX
                                    ]),
                                    eq(CategoryEntityTable.isSystemCategory, false),
                                    isNull(CategoryEntityTable.deletedAt)
                                ])
                            )
                            .groupBy(...buildEvidenceGroupBy(), TransactionEntryEntityTable.categoryId)
                    ),
                findTagEvidence: () =>
                    Db.query(db =>
                        selectEvidence(db, sql<number>`${TransactionTagsEntityTable.tagId}`.mapWith(Number))
                            .innerJoin(TransactionTagsEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
                            .where(buildEvidenceWhere([eq(TransactionTagsEntityTable.source, TagSourceEnum.USER)]))
                            .groupBy(...buildEvidenceGroupBy(), TransactionTagsEntityTable.tagId)
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionCategorizeInboxRepository, TransactionCategorizeInboxRepository.make);
}
