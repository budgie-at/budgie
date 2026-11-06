import {
    getExchangeRateWithHistoricalFallbackSql,
    buildCategoryTranslationJoinCondition,
    buildSpendingEntryCondition,
    RecurringSeriesKindEnum,
    AccountEntityTable,
    transactionFilters,
    CategoryEntityTable,
    DefaultCategoryTranslationEntityTable,
    Db,
    LanguageEnum,
    RecurringMatchSourceEnum,
    RecurringSeriesEntityTable,
    RecurringSeriesTransactionEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { and, asc, eq, getTableColumns, gt, gte, inArray, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { RECURRING_TRACKED_KINDS } from '../constant/recurring-tracked-kinds.constant';

import type { RecurringSeriesRowInterface } from '../interface/recurring-series-row.interface';
import type {
    RecurringSeriesCreateEntityInterface,
    RecurringSeriesTransactionCreateEntityInterface,
    RecurringSeriesTransactionEntityInterface
} from '@budgie/contracts';
import type { SQLWrapper, SQL } from 'drizzle-orm';

export class RecurringRepository extends Context.Service<RecurringRepository>()('@budgie/recurring/RecurringRepository', {
    make: Effect.suspend(() => {
        const buildRateToDefault = (instrumentId: SQLWrapper, defaultInstrumentId: number | null) =>
            isDefined(defaultInstrumentId)
                ? sql<number>`COALESCE(${getExchangeRateWithHistoricalFallbackSql(defaultInstrumentId, instrumentId)}, 1.0)`
                : sql<number>`1.0`;
        const kindConditions = {
            [RecurringSeriesKindEnum.EXPENSE]: [
                eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
                eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT)
            ],
            [RecurringSeriesKindEnum.INCOME]: [
                eq(TransactionEntityTable.type, TransactionTypeEnum.INCOME),
                eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.DEBIT),
                or(
                    isNull(TransactionEntityTable.consolidationType),
                    ne(TransactionEntityTable.consolidationType, TransactionConsolidationTypeEnum.REFUND)
                )
            ]
        } as const;

        const queryCharges =
            (historical: boolean, defaultInstrumentId: number | null, language: LanguageEnum, kind: RecurringSeriesKindEnum) =>
            (filter: SQL | undefined) =>
                Db.query(db => {
                    const rateToDefault = buildRateToDefault(AccountEntityTable.instrumentId, defaultInstrumentId);
                    const defaultAmount = sql<number>`${TransactionEntryEntityTable.amount} * ${rateToDefault}`;

                    return db
                        .select({
                            transactionId: TransactionEntityTable.id,
                            operatedAt: TransactionEntityTable.operatedAt,
                            title: TransactionEntityTable.title,
                            comment: TransactionEntityTable.comment,
                            defaultAmount,
                            kind: sql<RecurringSeriesKindEnum>`${kind}`,
                            nativeAmount: TransactionEntryEntityTable.amount,
                            instrumentId: AccountEntityTable.instrumentId,
                            counterpartyIban: TransactionEntryEntityTable.toIban,
                            accountId: AccountEntityTable.id,
                            categoryId: TransactionEntryEntityTable.categoryId,
                            categoryTitle: sql<
                                string | null
                            >`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`,
                            categoryIcon: CategoryEntityTable.icon
                        })
                        .from(TransactionEntityTable)
                        .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                        .leftJoin(CategoryEntityTable, eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id))
                        .leftJoin(DefaultCategoryTranslationEntityTable, buildCategoryTranslationJoinCondition(language))
                        .where(
                            and(
                                ...kindConditions[kind],
                                transactionFilters.buildVisibleTransactionCondition(),
                                transactionFilters.buildCategorizableEntryCondition(),
                                transactionFilters.buildNonDebtAccountCondition(),
                                ...(historical ? [] : [buildSpendingEntryCondition(), eq(AccountEntityTable.isActive, true)]),
                                gt(TransactionEntryEntityTable.amount, 0),
                                or(ne(TransactionEntityTable.title, ''), ne(TransactionEntityTable.comment, '')),
                                filter
                            )
                        );
                });

        const liveLinkedTransactions = sql`${TransactionEntityTable.id} IN (
            SELECT ${RecurringSeriesTransactionEntityTable.transactionId} FROM ${RecurringSeriesTransactionEntityTable}
            WHERE ${RecurringSeriesTransactionEntityTable.deletedAt} IS NULL
        )`;

        return Effect.succeed({
            findCharges: (
                defaultInstrumentId: number | null,
                language: LanguageEnum,
                since: Date,
                kind: RecurringSeriesKindEnum = RecurringSeriesKindEnum.EXPENSE
            ) => queryCharges(false, defaultInstrumentId, language, kind)(gte(TransactionEntityTable.operatedAt, since)),
            findHistoricalCharges: (
                defaultInstrumentId: number | null,
                language: LanguageEnum,
                since: Date,
                kind: RecurringSeriesKindEnum = RecurringSeriesKindEnum.EXPENSE
            ) => queryCharges(true, defaultInstrumentId, language, kind)(gte(TransactionEntityTable.operatedAt, since)),
            findLinkedCharges: (defaultInstrumentId: number | null, language: LanguageEnum) =>
                Effect.forEach(RECURRING_TRACKED_KINDS, kind =>
                    queryCharges(true, defaultInstrumentId, language, kind)(liveLinkedTransactions)
                ).pipe(Effect.map(charges => charges.flat())),
            findChargeByTransactionId: (
                defaultInstrumentId: number | null,
                language: LanguageEnum,
                kind: RecurringSeriesKindEnum,
                transactionId: number
            ) =>
                queryCharges(
                    true,
                    defaultInstrumentId,
                    language,
                    kind
                )(eq(TransactionEntityTable.id, transactionId)).pipe(Effect.map(([charge]) => charge)),
            findAllSeries: Db.query(db =>
                db
                    .select()
                    .from(RecurringSeriesEntityTable)
                    .where(isNull(RecurringSeriesEntityTable.deletedAt))
                    .orderBy(RecurringSeriesEntityTable.id)
            ),
            findSeriesById: (id: number) =>
                Db.query(db => db.select().from(RecurringSeriesEntityTable).where(eq(RecurringSeriesEntityTable.id, id)).limit(1)).pipe(
                    Effect.map(([series]) => series)
                ),
            findSeriesRows: (defaultInstrumentId: number | null, language: LanguageEnum, filter?: SQL) =>
                Db.query(db => {
                    const rateToDefault = buildRateToDefault(
                        sql`COALESCE(${RecurringSeriesEntityTable.instrumentId}, ${defaultInstrumentId})`,
                        defaultInstrumentId
                    );

                    return db
                        .select({
                            ...getTableColumns(RecurringSeriesEntityTable),
                            defaultAmount: sql<number>`${RecurringSeriesEntityTable.amount} * ${rateToDefault}`,
                            categoryTitle: sql<
                                string | null
                            >`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`,
                            categoryIcon: CategoryEntityTable.icon
                        })
                        .from(RecurringSeriesEntityTable)
                        .leftJoin(CategoryEntityTable, eq(RecurringSeriesEntityTable.categoryId, CategoryEntityTable.id))
                        .leftJoin(DefaultCategoryTranslationEntityTable, buildCategoryTranslationJoinCondition(language))
                        .where(and(isNull(RecurringSeriesEntityTable.deletedAt), filter))
                        .orderBy(asc(RecurringSeriesEntityTable.id));
                }).pipe(Effect.map((rows): readonly RecurringSeriesRowInterface[] => rows)),
            createSeries: (input: RecurringSeriesCreateEntityInterface) =>
                Db.query(db => db.insert(RecurringSeriesEntityTable).values([input]).returning()).pipe(Effect.map(([series]) => series)),
            updateSeries: (id: number, input: Partial<RecurringSeriesCreateEntityInterface>) =>
                Db.query(db =>
                    db
                        .update(RecurringSeriesEntityTable)
                        .set({ ...input, updatedAt: new Date() })
                        .where(eq(RecurringSeriesEntityTable.id, id))
                        .returning()
                ).pipe(Effect.map(([series]) => series)),
            setSeriesDeletedAt: (id: number, deletedAt: Date | null) =>
                Db.query(db =>
                    db
                        .update(RecurringSeriesEntityTable)
                        .set({ deletedAt, updatedAt: new Date() })
                        .where(eq(RecurringSeriesEntityTable.id, id))
                        .returning()
                ).pipe(Effect.map(([series]) => series)),
            findLinks: Db.query(db =>
                db.select().from(RecurringSeriesTransactionEntityTable).where(isNull(RecurringSeriesTransactionEntityTable.deletedAt))
            ),
            findLinksByTransactionId: (transactionId: number) =>
                Db.query(db =>
                    db
                        .select()
                        .from(RecurringSeriesTransactionEntityTable)
                        .where(
                            and(
                                eq(RecurringSeriesTransactionEntityTable.transactionId, transactionId),
                                isNull(RecurringSeriesTransactionEntityTable.deletedAt)
                            )
                        )
                ),
            findEverLinkedSeriesIds: Db.query(db =>
                db.selectDistinct({ seriesId: RecurringSeriesTransactionEntityTable.seriesId }).from(RecurringSeriesTransactionEntityTable)
            ).pipe(Effect.map(rows => new Set(rows.map(row => row.seriesId)))),
            findLinkByPair: (seriesId: number, transactionId: number) =>
                Db.query(db =>
                    db
                        .select()
                        .from(RecurringSeriesTransactionEntityTable)
                        .where(
                            and(
                                eq(RecurringSeriesTransactionEntityTable.seriesId, seriesId),
                                eq(RecurringSeriesTransactionEntityTable.transactionId, transactionId)
                            )
                        )
                        .limit(1)
                ).pipe(Effect.map(([link]) => link)),
            findLinksDeletedAt: (seriesId: number, deletedAt: Date) =>
                Db.query(db =>
                    db
                        .select()
                        .from(RecurringSeriesTransactionEntityTable)
                        .where(
                            and(
                                eq(RecurringSeriesTransactionEntityTable.seriesId, seriesId),
                                eq(RecurringSeriesTransactionEntityTable.deletedAt, deletedAt)
                            )
                        )
                ),
            upsertAutoLinks: (inputs: readonly RecurringSeriesTransactionCreateEntityInterface[]) =>
                isEmptyArray(inputs)
                    ? Effect.succeed<readonly RecurringSeriesTransactionEntityInterface[]>([])
                    : Db.query(db =>
                          db
                              .insert(RecurringSeriesTransactionEntityTable)
                              .values([...inputs])
                              .onConflictDoUpdate({
                                  target: [
                                      RecurringSeriesTransactionEntityTable.seriesId,
                                      RecurringSeriesTransactionEntityTable.transactionId
                                  ],
                                  set: { deletedAt: null, cycleDate: sql`excluded.cycle_date`, updatedAt: new Date() },
                                  setWhere: and(
                                      isNotNull(RecurringSeriesTransactionEntityTable.deletedAt),
                                      eq(RecurringSeriesTransactionEntityTable.matchedBy, RecurringMatchSourceEnum.AUTO),
                                      eq(RecurringSeriesTransactionEntityTable.isExcluded, false)
                                  )
                              })
                              .returning()
                      ),
            insertLink: (input: RecurringSeriesTransactionCreateEntityInterface) =>
                Db.query(db => db.insert(RecurringSeriesTransactionEntityTable).values([input]).returning()).pipe(
                    Effect.map(([link]) => link)
                ),
            updateLink: (
                id: number,
                input: Partial<Pick<RecurringSeriesTransactionEntityInterface, 'cycleDate' | 'matchedBy' | 'isExcluded' | 'deletedAt'>>
            ) =>
                Db.query(db =>
                    db
                        .update(RecurringSeriesTransactionEntityTable)
                        .set({ ...input, updatedAt: new Date() })
                        .where(eq(RecurringSeriesTransactionEntityTable.id, id))
                        .returning()
                ).pipe(Effect.map(([link]) => link)),
            setLinksDeletedAt: (ids: readonly number[], deletedAt: Date | null) =>
                isEmptyArray(ids)
                    ? Effect.void
                    : Db.query(db =>
                          db
                              .update(RecurringSeriesTransactionEntityTable)
                              .set({ deletedAt, updatedAt: new Date() })
                              .where(inArray(RecurringSeriesTransactionEntityTable.id, [...ids]))
                      ).pipe(Effect.asVoid)
        });
    })
}) {
    static readonly layer = Layer.effect(RecurringRepository, RecurringRepository.make);
}
