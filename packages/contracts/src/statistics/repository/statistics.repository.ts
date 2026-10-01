/* eslint-disable max-lines -- File owns the single multi-stage statistics SQL aggregation pipeline that must stay together */
import { SQL, and, desc, eq, getTableColumns, inArray, isNotNull, isNull, ne, notInArray, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { buildTranslatedCategoryRelation } from '../../@generic/util/build-translated-category-relation.util';
import {
    getDirectExchangeRateSql,
    getHistoricalExchangeRateSql,
    getInverseExchangeRateSql,
    getInverseHistoricalExchangeRateSql
} from '../../@generic/util/get-exchange-rate-sql.util';
import { AccountAssociationEnum } from '../../account/enum/account-association.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { DefaultCategoryTranslationEntityTable } from '../../category-translation/table/default-category-translation-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { DebtEventAssociationEnum } from '../../debt-event/enum/debt-event-association.enum';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { RunwayDriverDimensionEnum } from '../../runway/enum/runway-driver-dimension.enum';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntryAssociationEnum } from '../../transaction-entry/enum/transaction-entry-association.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { buildSpendingEntryCondition } from '../../transaction-entry/util/build-spending-entry-condition.util';
import { TransactionTagsAssociationEnum } from '../../transaction-tags/enum/transaction-tags-association.enum';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionAssociationEnum } from '../../transaction/enum/transaction-association.enum';
import { TransactionConsolidationTypeEnum } from '../../transaction/enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionFilterInterface } from '../../transaction/interface/transaction-filter.interface';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { StatisticsFilterInterface } from '../interface/statistics-filter.interface';

import type { DB } from '../../@generic/type/db.type';
import type { SelectedFields } from 'drizzle-orm/sqlite-core';

export class StatisticsRepository extends Context.Service<StatisticsRepository>()('@budgie/contracts/StatisticsRepository', {
    make: Effect.sync(() => {
        const transactionFilters = new BaseTransactionFilterRepository();

        /* jscpd:ignore-start */
        const buildStatisticsTransactionsQuery = (db: DB, filters: TransactionFilterInterface, type: TransactionTypeEnum) => {
            const baseWhere = transactionFilters.buildFilterWhere(filters);

            return db
                .selectDistinct({ id: TransactionEntityTable.id })
                .from(TransactionEntityTable)
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                .where(
                    and(
                        baseWhere,
                        transactionFilters.buildPrimaryLedgerEntryCondition(),
                        transactionFilters.buildNonDebtAccountCondition(),
                        buildSpendingEntryCondition(),
                        eq(TransactionEntityTable.type, type)
                    )
                );
        };

        const buildExcludedCategoryCondition = (db: DB, categoryIds: number[]) =>
            inArray(
                TransactionEntityTable.id,
                db
                    .select({ transactionId: TransactionEntryEntityTable.transactionId })
                    .from(TransactionEntryEntityTable)
                    .where(
                        and(
                            or(
                                isNull(TransactionEntryEntityTable.categoryId),
                                notInArray(TransactionEntryEntityTable.categoryId, categoryIds)
                            ),
                            transactionFilters.buildLedgerEntryCondition()
                        )
                    )
            );

        const buildStatisticsFilterWhere = (db: DB, filters: StatisticsFilterInterface) =>
            and(
                transactionFilters.buildFilterWhere(filters),
                ...(isNotEmptyArray(filters.excludedCategoryIds) ? [buildExcludedCategoryCondition(db, filters.excludedCategoryIds)] : [])
            );

        const buildStatisticsTransactionIdsQuery = (db: DB, filters: StatisticsFilterInterface) => {
            const baseWhere = buildStatisticsFilterWhere(db, filters);
            const typeConditions = isDefined(filters.type) ? [eq(TransactionEntityTable.type, filters.type)] : [];

            return db
                .selectDistinct({ id: TransactionEntityTable.id })
                .from(TransactionEntityTable)
                .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                .where(
                    and(
                        baseWhere,
                        transactionFilters.buildPrimaryLedgerEntryCondition(),
                        transactionFilters.buildNonDebtAccountCondition(),
                        buildSpendingEntryCondition(),
                        ...typeConditions
                    )
                );
        };
        /* jscpd:ignore-end */

        const buildTransactionIdsQuery = (db: DB, filters: TransactionFilterInterface, type: TransactionTypeEnum) => {
            const baseWhere = transactionFilters.buildFilterWhere(filters);

            return db
                .selectDistinct({ transactionId: TransactionEntityTable.id })
                .from(TransactionEntityTable)
                .where(and(baseWhere, eq(TransactionEntityTable.type, type)));
        };

        const buildConversionRateSql = (defaultInstrumentId: number, instrumentIdRef: SQL) =>
            sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)}
        )`;

        const buildEntryBaseValueSql = (defaultInstrumentId: number) =>
            sql<number>`CASE
            WHEN ${TransactionEntryEntityTable.baseInstrumentId} = ${defaultInstrumentId}
            THEN ${TransactionEntryEntityTable.baseAmount}
            WHEN ${AccountEntityTable.instrumentId} = ${defaultInstrumentId}
            THEN ${TransactionEntryEntityTable.amount}
            ELSE ROUND(${TransactionEntryEntityTable.amount} * ${buildConversionRateSql(defaultInstrumentId, sql.raw('accounts.instrument_id'))})
        END`;

        const buildRefundTotalBaseAmountSql = (defaultInstrumentId: number) =>
            sql<number>`COALESCE((
            SELECT SUM(CASE
                WHEN refund_entry.base_instrument_id = ${defaultInstrumentId} THEN refund_entry.base_amount
                WHEN refund_account.instrument_id = ${defaultInstrumentId} THEN refund_entry.amount
                ELSE ROUND(refund_entry.amount * ${buildConversionRateSql(defaultInstrumentId, sql.raw('refund_account.instrument_id'))})
            END)
            FROM transaction_entries refund_entry
            INNER JOIN accounts refund_account ON refund_account.id = refund_entry.account_id
            WHERE refund_entry.transaction_id = ${TransactionEntryEntityTable.transactionId}
              AND refund_entry.original_transaction_id IS NOT NULL
              AND refund_entry.deleted_at IS NULL
              AND refund_entry.type = ${TransactionEntryTypeEnum.DEBIT}
        ), 0)`;

        const buildLedgerCreditBaseAmountTotalSql = (defaultInstrumentId: number) =>
            sql<number>`COALESCE((
            SELECT SUM(CASE
                WHEN ledger_credit.base_instrument_id = ${defaultInstrumentId} THEN ledger_credit.base_amount
                WHEN ledger_account.instrument_id = ${defaultInstrumentId} THEN ledger_credit.amount
                ELSE ROUND(ledger_credit.amount * ${buildConversionRateSql(defaultInstrumentId, sql.raw('ledger_account.instrument_id'))})
            END)
            FROM transaction_entries ledger_credit
            INNER JOIN accounts ledger_account ON ledger_account.id = ledger_credit.account_id
            WHERE ledger_credit.transaction_id = ${TransactionEntryEntityTable.transactionId}
              AND ledger_credit.original_transaction_id IS NULL
              AND ledger_credit.deleted_at IS NULL
              AND ledger_credit.type = ${TransactionEntryTypeEnum.CREDIT}
        ), 0)`;

        const buildRefundAdjustedCreditBaseAmountSql = (defaultInstrumentId: number) =>
            sql<number>`
            ${buildEntryBaseValueSql(defaultInstrumentId)}
            - (
                ${buildRefundTotalBaseAmountSql(defaultInstrumentId)}
                * ${buildEntryBaseValueSql(defaultInstrumentId)}
                / NULLIF(${buildLedgerCreditBaseAmountTotalSql(defaultInstrumentId)}, 0)
            )
        `;

        const buildRefundAwareBaseAmountSql = (defaultInstrumentId: number) =>
            sql<number>`COALESCE(SUM(CASE
            WHEN ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
                 AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
            THEN ${buildRefundAdjustedCreditBaseAmountSql(defaultInstrumentId)}
            ELSE ${buildEntryBaseValueSql(defaultInstrumentId)}
        END), 0)`;

        /* jscpd:ignore-start */
        const buildCategoryBreakdownQuery = (
            db: DB,
            transactionIdsSubquery: ReturnType<typeof buildTransactionIdsQuery>,
            defaultInstrumentId: number,
            language: LanguageEnum
        ) => {
            const amountSql = buildRefundAwareBaseAmountSql(defaultInstrumentId);
            const categoryTitleSql = sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`;

            return db
                .select({
                    category: { ...getTableColumns(CategoryEntityTable), title: categoryTitleSql.as('title') },
                    amount: amountSql.as('amount')
                })
                .from(TransactionEntryEntityTable)
                .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                .leftJoin(CategoryEntityTable, eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id))
                .leftJoin(
                    DefaultCategoryTranslationEntityTable,
                    and(
                        eq(DefaultCategoryTranslationEntityTable.categoryId, CategoryEntityTable.id),
                        eq(DefaultCategoryTranslationEntityTable.language, language)
                    )
                )
                .where(
                    and(
                        inArray(TransactionEntityTable.id, transactionIdsSubquery),
                        transactionFilters.buildPrimaryLedgerEntryCondition(),
                        transactionFilters.buildNonDebtAccountCondition()
                    )
                )
                .groupBy(TransactionEntryEntityTable.categoryId, categoryTitleSql)
                .orderBy(desc(amountSql));
        };

        const buildTagBreakdownQuery = (
            db: DB,
            transactionIdsSubquery: ReturnType<typeof buildTransactionIdsQuery>,
            defaultInstrumentId: number
        ) => {
            const amountSql = buildRefundAwareBaseAmountSql(defaultInstrumentId);

            return db
                .select({
                    tag: TagEntityTable,
                    amount: amountSql.as('amount')
                })
                .from(TransactionEntryEntityTable)
                .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                .leftJoin(TransactionTagsEntityTable, eq(TransactionEntityTable.id, TransactionTagsEntityTable.transactionId))
                .leftJoin(TagEntityTable, eq(TransactionTagsEntityTable.tagId, TagEntityTable.id))
                .where(
                    and(
                        inArray(TransactionEntityTable.id, transactionIdsSubquery),
                        transactionFilters.buildPrimaryLedgerEntryCondition(),
                        transactionFilters.buildNonDebtAccountCondition()
                    )
                )
                .groupBy(TagEntityTable.id)
                .orderBy(desc(amountSql));
        };

        const buildStatisticsWhere = (filters: TransactionFilterInterface) => {
            const baseWhere = transactionFilters.buildFilterWhere(filters);

            return and(baseWhere, ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT), buildSpendingEntryCondition());
        };

        const buildExpenseCategoryBreakdownQuery = (
            db: DB,
            filters: TransactionFilterInterface,
            defaultInstrumentId: number,
            language: LanguageEnum
        ) => {
            const amountSql = buildRefundAwareBaseAmountSql(defaultInstrumentId);
            const categoryTitleSql = sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`;

            return db
                .select({
                    category: { ...getTableColumns(CategoryEntityTable), title: categoryTitleSql.as('title') },
                    amount: amountSql.as('amount')
                })
                .from(TransactionEntryEntityTable)
                .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                .leftJoin(CategoryEntityTable, eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id))
                .leftJoin(
                    DefaultCategoryTranslationEntityTable,
                    and(
                        eq(DefaultCategoryTranslationEntityTable.categoryId, CategoryEntityTable.id),
                        eq(DefaultCategoryTranslationEntityTable.language, language)
                    )
                )
                .where(
                    and(
                        buildStatisticsWhere(filters),
                        transactionFilters.buildExpenseAnalyticsEntryCondition(),
                        transactionFilters.buildPrimaryLedgerEntryCondition(),
                        transactionFilters.buildNonDebtAccountCondition()
                    )
                )
                .groupBy(TransactionEntryEntityTable.categoryId, categoryTitleSql)
                .orderBy(desc(amountSql));
        };

        const buildExpenseTagBreakdownQuery = (db: DB, filters: TransactionFilterInterface, defaultInstrumentId: number) => {
            const amountSql = buildRefundAwareBaseAmountSql(defaultInstrumentId);

            return db
                .select({
                    tag: TagEntityTable,
                    amount: amountSql.as('amount')
                })
                .from(TransactionEntryEntityTable)
                .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                .leftJoin(TransactionTagsEntityTable, eq(TransactionEntityTable.id, TransactionTagsEntityTable.transactionId))
                .leftJoin(TagEntityTable, eq(TransactionTagsEntityTable.tagId, TagEntityTable.id))
                .where(
                    and(
                        buildStatisticsWhere(filters),
                        transactionFilters.buildExpenseAnalyticsEntryCondition(),
                        transactionFilters.buildPrimaryLedgerEntryCondition(),
                        transactionFilters.buildNonDebtAccountCondition(),
                        or(ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER), isNotNull(TransactionTagsEntityTable.tagId))
                    )
                )
                .groupBy(TagEntityTable.id)
                .orderBy(desc(amountSql));
        };
        /* jscpd:ignore-end */

        const buildVisibleNonDebtEntryCondition = (type: TransactionEntryTypeEnum) =>
            sql`
            ${TransactionEntryEntityTable.type} = ${type}
            AND ${TransactionEntityTable.type} != ${TransactionTypeEnum.TRANSFER}
            AND ${TransactionEntityTable.type} != ${TransactionTypeEnum.DEBT}
            AND ${transactionFilters.buildNonDebtAccountCondition()}
        `;

        const buildIncomeEntryValueSql = (defaultInstrumentId: number) =>
            sql<number>`CASE
            WHEN ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
                 AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
            THEN 0
            WHEN ${buildVisibleNonDebtEntryCondition(TransactionEntryTypeEnum.DEBIT)}
            THEN ${buildEntryBaseValueSql(defaultInstrumentId)}
            ELSE 0
        END`;

        const buildExpenseEntryValueSql = (defaultInstrumentId: number) =>
            sql<number>`CASE
            WHEN ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
                 AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
                 AND ${transactionFilters.buildNonDebtAccountCondition()}
            THEN ${buildRefundAdjustedCreditBaseAmountSql(defaultInstrumentId)}
            WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.FEE}
                 AND ${transactionFilters.buildNonDebtAccountCondition()}
            THEN ${buildEntryBaseValueSql(defaultInstrumentId)}
            WHEN ${buildVisibleNonDebtEntryCondition(TransactionEntryTypeEnum.CREDIT)}
            THEN ${buildEntryBaseValueSql(defaultInstrumentId)}
            ELSE 0
        END`;

        const buildIncomeTotalSql = (defaultInstrumentId: number) =>
            sql<number>`COALESCE(SUM(${buildIncomeEntryValueSql(defaultInstrumentId)}), 0)`;

        const buildExpenseTotalSql = (defaultInstrumentId: number) =>
            sql<number>`COALESCE(SUM(${buildExpenseEntryValueSql(defaultInstrumentId)}), 0)`;

        const buildLedgerEntriesQuery = <TSelection extends SelectedFields>(db: DB, selectFields: TSelection) =>
            db.select(selectFields).from(TransactionEntryEntityTable);

        const buildIncomeExpenseFields = (defaultInstrumentId: number) => ({
            income: buildIncomeTotalSql(defaultInstrumentId).as('income'),
            expense: buildExpenseTotalSql(defaultInstrumentId).as('expense')
        });

        const buildRunwayDriverFields = (monthSql: SQL<string>, amountSql: SQL<number>) => ({
            month: monthSql.as('month'),
            amount: amountSql.as('amount')
        });

        const buildStatisticsLedgerWhere = (filters: TransactionFilterInterface, extraCondition?: SQL) =>
            and(buildStatisticsWhere(filters), transactionFilters.buildPrimaryLedgerEntryCondition(), extraCondition);

        const buildRunwayMonthSql = () => sql<string>`strftime('%Y-%m', ${TransactionEntityTable.operatedAt}, 'unixepoch', 'localtime')`;

        const buildRunwayCompleteMonthsCondition = (months: number) => {
            const windowStartEpoch = sql`unixepoch(strftime('%Y-%m-01', 'now', 'localtime', ${`-${months} months`}), 'utc')`;
            const currentMonthStartEpoch = sql`unixepoch(strftime('%Y-%m-01', 'now', 'localtime'), 'utc')`;

            return and(
                sql`${TransactionEntityTable.operatedAt} >= ${windowStartEpoch}`,
                sql`${TransactionEntityTable.operatedAt} < ${currentMonthStartEpoch}`
            );
        };

        const buildRunwayDriverSeriesBaseQuery = (
            db: DB,
            idColumn: typeof CategoryEntityTable.id | typeof TagEntityTable.id,
            titleSql: SQL<string>,
            amountSql: SQL<number>
        ) =>
            buildLedgerEntriesQuery(db, {
                id: idColumn,
                title: titleSql.as('title'),
                ...buildRunwayDriverFields(buildRunwayMonthSql(), amountSql)
            })
                .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id));

        const buildRunwayCategoryDriverSeriesQuery =
            (filters: TransactionFilterInterface, defaultInstrumentId: number, months: number, language: LanguageEnum) => (db: DB) => {
                const amountSql = buildExpenseTotalSql(defaultInstrumentId);
                const monthSql = buildRunwayMonthSql();
                const categoryTitleSql = sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title}, '')`;

                return buildRunwayDriverSeriesBaseQuery(db, CategoryEntityTable.id, categoryTitleSql, amountSql)
                    .leftJoin(CategoryEntityTable, eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id))
                    .leftJoin(
                        DefaultCategoryTranslationEntityTable,
                        and(
                            eq(DefaultCategoryTranslationEntityTable.categoryId, CategoryEntityTable.id),
                            eq(DefaultCategoryTranslationEntityTable.language, language)
                        )
                    )
                    .where(buildStatisticsLedgerWhere(filters, buildRunwayCompleteMonthsCondition(months)))
                    .groupBy(CategoryEntityTable.id, categoryTitleSql, monthSql)
                    .orderBy(monthSql, desc(amountSql));
            };

        const buildRunwayTagDriverSeriesQuery = (
            db: DB,
            filters: TransactionFilterInterface,
            defaultInstrumentId: number,
            months: number
        ) => {
            const amountSql = buildExpenseTotalSql(defaultInstrumentId);
            const monthSql = buildRunwayMonthSql();
            const tagTitleSql = sql<string>`COALESCE(${TagEntityTable.title}, '')`;

            return buildRunwayDriverSeriesBaseQuery(db, TagEntityTable.id, tagTitleSql, amountSql)
                .leftJoin(TransactionTagsEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
                .leftJoin(TagEntityTable, eq(TransactionTagsEntityTable.tagId, TagEntityTable.id))
                .where(buildStatisticsLedgerWhere(filters, buildRunwayCompleteMonthsCondition(months)))
                .groupBy(TagEntityTable.id, tagTitleSql, monthSql)
                .orderBy(monthSql, desc(amountSql));
        };

        return {
            getTransactions: (filters: StatisticsFilterInterface, limit: number, language: LanguageEnum) =>
                Db.query(db => {
                    const transactionIds = buildStatisticsTransactionIdsQuery(db, filters);

                    return db.query.TransactionEntityTable.findMany({
                        /* jscpd:ignore-start */
                        with: {
                            [TransactionAssociationEnum.ENTRIES]: {
                                where: transactionFilters.buildLedgerEntryCondition(),
                                with: {
                                    [TransactionEntryAssociationEnum.ACCOUNT]: {
                                        with: {
                                            [AccountAssociationEnum.INSTRUMENT]: true
                                        }
                                    },
                                    [TransactionEntryAssociationEnum.CATEGORY]: buildTranslatedCategoryRelation(language),
                                    [TransactionEntryAssociationEnum.MCC_CATEGORY]: true
                                }
                            },
                            [TransactionAssociationEnum.TRANSACTION_TAGS]: {
                                with: {
                                    [TransactionTagsAssociationEnum.TAG]: true
                                }
                            },
                            [TransactionAssociationEnum.DEBT_EVENTS]: {
                                where: isNull(DebtEventEntityTable.deletedAt),
                                with: {
                                    [DebtEventAssociationEnum.DEBT_ACCOUNT]: {
                                        with: {
                                            [AccountAssociationEnum.INSTRUMENT]: true
                                        }
                                    }
                                }
                            },
                            [TransactionAssociationEnum.FROM_ACCOUNT]: true,
                            [TransactionAssociationEnum.TO_ACCOUNT]: true
                        },
                        /* jscpd:ignore-end */
                        where: inArray(TransactionEntityTable.id, transactionIds),
                        orderBy: (transaction, { desc: descFn }) => [descFn(transaction.operatedAt)],
                        limit
                    });
                }),

            getTotalIncomeAndExpenseQuery: (filters: TransactionFilterInterface, defaultInstrumentId: number) =>
                Db.query(db =>
                    buildLedgerEntriesQuery(db, buildIncomeExpenseFields(defaultInstrumentId))
                        .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                        .where(buildStatisticsLedgerWhere(filters))
                ),

            getRunwaySeriesQuery: (filters: TransactionFilterInterface, defaultInstrumentId: number, months: number) =>
                Db.query(db => {
                    const monthSql = buildRunwayMonthSql();

                    return buildLedgerEntriesQuery(db, { month: monthSql.as('month'), ...buildIncomeExpenseFields(defaultInstrumentId) })
                        .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                        .where(buildStatisticsLedgerWhere(filters, buildRunwayCompleteMonthsCondition(months)))
                        .groupBy(monthSql)
                        .orderBy(monthSql);
                }),

            // eslint-disable-next-line @typescript-eslint/max-params -- Runway drivers keep the mandated positional signature (filters, defaultInstrumentId, dimension, months, language)
            getRunwayDriverSeriesQuery: (
                filters: TransactionFilterInterface,
                defaultInstrumentId: number,
                dimension: RunwayDriverDimensionEnum,
                months: number,
                language: LanguageEnum
            ) =>
                Db.query(db =>
                    dimension === RunwayDriverDimensionEnum.CATEGORY
                        ? buildRunwayCategoryDriverSeriesQuery(filters, defaultInstrumentId, months, language)(db)
                        : buildRunwayTagDriverSeriesQuery(db, filters, defaultInstrumentId, months)
                ),

            getIncomeByCategoryQuery: (filters: TransactionFilterInterface, defaultInstrumentId: number, language: LanguageEnum) =>
                Db.query(db =>
                    buildCategoryBreakdownQuery(
                        db,
                        buildTransactionIdsQuery(db, filters, TransactionTypeEnum.INCOME),
                        defaultInstrumentId,
                        language
                    )
                ),

            getExpenseByCategoryQuery: (filters: TransactionFilterInterface, defaultInstrumentId: number, language: LanguageEnum) =>
                Db.query(db => buildExpenseCategoryBreakdownQuery(db, filters, defaultInstrumentId, language)),

            getIncomeByTagQuery: (filters: TransactionFilterInterface, defaultInstrumentId: number) =>
                Db.query(db =>
                    buildTagBreakdownQuery(db, buildTransactionIdsQuery(db, filters, TransactionTypeEnum.INCOME), defaultInstrumentId)
                ),

            getExpenseByTagQuery: (filters: TransactionFilterInterface, defaultInstrumentId: number) =>
                Db.query(db => buildExpenseTagBreakdownQuery(db, filters, defaultInstrumentId)),

            getIncomeTransactionsQuery: (filters: TransactionFilterInterface) =>
                Db.query(db => buildStatisticsTransactionsQuery(db, filters, TransactionTypeEnum.INCOME)),

            getExpenseTransactionsQuery: (filters: TransactionFilterInterface) =>
                Db.query(db => buildStatisticsTransactionsQuery(db, filters, TransactionTypeEnum.EXPENSE))
        };
    })
}) {
    static readonly layer = Layer.effect(StatisticsRepository, StatisticsRepository.make);
}
