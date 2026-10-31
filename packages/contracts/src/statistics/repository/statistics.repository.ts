/* eslint-disable max-lines -- File owns the single multi-stage statistics SQL aggregation pipeline that must stay together */
import { SQL, and, desc, eq, getTableColumns, gt, gte, inArray, isNotNull, isNull, lt, lte, ne, notInArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { PRECISION } from '../../@generic/constant/precision.constant';
import { LanguageEnum } from '../../@generic/enum/language.enum';
import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { buildCategoryTranslationJoinCondition } from '../../@generic/utils/build-category-translation-join-condition.util';
import {
    getDirectExchangeRateSql,
    getHistoricalExchangeRateSql,
    getInverseExchangeRateSql,
    getInverseHistoricalExchangeRateSql
} from '../../@generic/utils/get-exchange-rate-sql.util';
import { CRYPTO_ACCOUNT_TYPES } from '../../account/constant/crypto-account-types.constant';
import { LIQUID_ACCOUNT_TYPES } from '../../account/constant/liquid-account-types.constant';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { DefaultCategoryTranslationEntityTable } from '../../category-translation/table/default-category-translation-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { RunwayDriverDimensionEnum } from '../../runway/enum/runway-driver-dimension.enum';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { buildSpendingEntryCondition } from '../../transaction-entry/utils/build-spending-entry-condition.util';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionConsolidationTypeEnum } from '../../transaction/enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionFilterInterface } from '../../transaction/interface/transaction-filter.interface';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { StatisticsFilterInterface } from '../interface/statistics-filter.interface';

import type { DB } from '../../@generic/type/db.type';
import type { SelectedFields } from 'drizzle-orm/sqlite-core';

export class StatisticsRepository extends Context.Service<StatisticsRepository>()('@budgie/contracts/StatisticsRepository', {
    make: Effect.sync(() => {
        const buildSpendingTransactionIdsQuery = (db: DB, baseWhere: SQL | undefined, type: TransactionTypeEnum | null) =>
            db
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
                        ...(isDefined(type) ? [eq(TransactionEntityTable.type, type)] : [])
                    )
                );

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

        const buildConversionRateSql = (defaultInstrumentId: number, instrumentIdRef: SQL) =>
            sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)}
        )`;

        const minorUnitMicroUnits = PRECISION / 100;

        const roundToMinorUnitSql = (value: SQL) =>
            sql<number>`(CAST(ROUND((${value}) * 1.0 / ${minorUnitMicroUnits}) AS INTEGER) * ${minorUnitMicroUnits})`;

        const buildEntryBaseValueSql = (defaultInstrumentId: number) =>
            roundToMinorUnitSql(sql`CASE
            WHEN ${TransactionEntryEntityTable.baseInstrumentId} = ${defaultInstrumentId}
            THEN ${TransactionEntryEntityTable.baseAmount}
            WHEN ${AccountEntityTable.instrumentId} = ${defaultInstrumentId}
            THEN ${TransactionEntryEntityTable.amount}
            ELSE ROUND(${TransactionEntryEntityTable.amount} * ${buildConversionRateSql(defaultInstrumentId, sql.raw('accounts.instrument_id'))})
        END`);

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
            roundToMinorUnitSql(sql`
            ${buildEntryBaseValueSql(defaultInstrumentId)}
            - (
                ${buildRefundTotalBaseAmountSql(defaultInstrumentId)}
                * ${buildEntryBaseValueSql(defaultInstrumentId)}
                / NULLIF(${buildLedgerCreditBaseAmountTotalSql(defaultInstrumentId)}, 0)
            )
        `);

        const buildRefundAwareBaseAmountSql = (defaultInstrumentId: number) =>
            sql<number>`COALESCE(SUM(CASE
            WHEN ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
                 AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
            THEN ${buildRefundAdjustedCreditBaseAmountSql(defaultInstrumentId)}
            ELSE ${buildEntryBaseValueSql(defaultInstrumentId)}
        END), 0)`;

        const buildLedgerEntriesQuery = <TSelection extends SelectedFields>(db: DB, selectFields: TSelection) =>
            db.select(selectFields).from(TransactionEntryEntityTable);

        const buildBreakdownQuery = <TSelection extends SelectedFields>(db: DB, selectFields: TSelection, amountSql: SQL<number>) =>
            buildLedgerEntriesQuery(db, {
                ...selectFields,
                amount: amountSql.as('amount'),
                transactionCount: sql<number>`COUNT(DISTINCT ${TransactionEntryEntityTable.transactionId})`.as('transaction_count')
            })
                .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id));

        const buildCategoryBreakdownQuery = (db: DB, defaultInstrumentId: number, language: LanguageEnum, where: SQL | undefined) => {
            const amountSql = buildRefundAwareBaseAmountSql(defaultInstrumentId);
            const categoryTitleSql = sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`;

            return buildBreakdownQuery(
                db,
                { category: { ...getTableColumns(CategoryEntityTable), title: categoryTitleSql.as('title') } },
                amountSql
            )
                .leftJoin(CategoryEntityTable, eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id))
                .leftJoin(DefaultCategoryTranslationEntityTable, buildCategoryTranslationJoinCondition(language))
                .where(where)
                .groupBy(TransactionEntryEntityTable.categoryId, categoryTitleSql)
                .having(ne(amountSql, 0))
                .orderBy(desc(amountSql));
        };

        const buildTagBreakdownQuery = (db: DB, defaultInstrumentId: number, where: SQL | undefined) => {
            const amountSql = buildRefundAwareBaseAmountSql(defaultInstrumentId);

            return buildBreakdownQuery(db, { tag: TagEntityTable }, amountSql)
                .leftJoin(TransactionTagsEntityTable, eq(TransactionEntityTable.id, TransactionTagsEntityTable.transactionId))
                .leftJoin(TagEntityTable, eq(TransactionTagsEntityTable.tagId, TagEntityTable.id))
                .where(where)
                .groupBy(TagEntityTable.id)
                .having(ne(amountSql, 0))
                .orderBy(desc(amountSql));
        };

        const buildIncomeBreakdownWhere = (db: DB, filters: TransactionFilterInterface) =>
            and(
                inArray(
                    TransactionEntityTable.id,
                    db
                        .selectDistinct({ transactionId: TransactionEntityTable.id })
                        .from(TransactionEntityTable)
                        .where(
                            and(transactionFilters.buildFilterWhere(filters), eq(TransactionEntityTable.type, TransactionTypeEnum.INCOME))
                        )
                ),
                transactionFilters.buildPrimaryLedgerEntryCondition(),
                transactionFilters.buildNonDebtAccountCondition(),
                buildSpendingEntryCondition()
            );

        const buildStatisticsWhere = (filters: TransactionFilterInterface) => {
            const baseWhere = transactionFilters.buildFilterWhere(filters);

            return and(baseWhere, ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT), buildSpendingEntryCondition());
        };

        const buildExpenseBreakdownWhere = (filters: TransactionFilterInterface, extraCondition?: SQL) =>
            and(
                buildStatisticsWhere(filters),
                transactionFilters.buildExpenseAnalyticsEntryCondition(),
                transactionFilters.buildPrimaryLedgerEntryCondition(),
                transactionFilters.buildNonDebtAccountCondition(),
                extraCondition
            );

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

        const buildRunwayWhere = (filters: TransactionFilterInterface, months: number, isCryptoIncluded: boolean) => {
            const windowStartEpoch = sql`unixepoch(strftime('%Y-%m-01', 'now', 'localtime', 'start of month', ${`-${months} months`}), 'utc')`;
            const currentMonthStartEpoch = sql`unixepoch(strftime('%Y-%m-01', 'now', 'localtime'), 'utc')`;

            return buildStatisticsLedgerWhere(
                filters,
                and(
                    sql`${TransactionEntityTable.operatedAt} >= ${windowStartEpoch}`,
                    sql`${TransactionEntityTable.operatedAt} < ${currentMonthStartEpoch}`,
                    inArray(
                        AccountEntityTable.type,
                        isCryptoIncluded ? [...LIQUID_ACCOUNT_TYPES, ...CRYPTO_ACCOUNT_TYPES] : LIQUID_ACCOUNT_TYPES
                    ),
                    eq(AccountEntityTable.isActive, true),
                    isNull(AccountEntityTable.deletedAt)
                )
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

        const buildRunwayCategoryDriverSeriesQuery = (
            db: DB,
            defaultInstrumentId: number,
            language: LanguageEnum,
            where: SQL | undefined
        ) => {
            const amountSql = buildExpenseTotalSql(defaultInstrumentId);
            const monthSql = buildRunwayMonthSql();
            const categoryTitleSql = sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title}, '')`;

            return buildRunwayDriverSeriesBaseQuery(db, CategoryEntityTable.id, categoryTitleSql, amountSql)
                .leftJoin(CategoryEntityTable, eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id))
                .leftJoin(DefaultCategoryTranslationEntityTable, buildCategoryTranslationJoinCondition(language))
                .where(where)
                .groupBy(CategoryEntityTable.id, categoryTitleSql, monthSql)
                .orderBy(monthSql, desc(amountSql));
        };

        const buildRunwayTagDriverSeriesQuery = (db: DB, defaultInstrumentId: number, where: SQL | undefined) => {
            const amountSql = buildExpenseTotalSql(defaultInstrumentId);
            const monthSql = buildRunwayMonthSql();
            const tagTitleSql = sql<string>`COALESCE(${TagEntityTable.title}, '')`;

            return buildRunwayDriverSeriesBaseQuery(db, TagEntityTable.id, tagTitleSql, amountSql)
                .leftJoin(TransactionTagsEntityTable, eq(TransactionTagsEntityTable.transactionId, TransactionEntityTable.id))
                .leftJoin(TagEntityTable, eq(TransactionTagsEntityTable.tagId, TagEntityTable.id))
                .where(where)
                .groupBy(TagEntityTable.id, tagTitleSql, monthSql)
                .orderBy(monthSql, desc(amountSql));
        };

        return {
            getTransactions: (filters: StatisticsFilterInterface, limit: number, language: LanguageEnum) =>
                Db.query(db => {
                    const transactionIds = buildSpendingTransactionIdsQuery(db, buildStatisticsFilterWhere(db, filters), filters.type);

                    return db.query.TransactionEntityTable.findMany({
                        with: transactionFilters.buildFullTransactionRelations(language),
                        where: {
                            RAW: (transactionTable, { inArray: inTransactionIds }) => inTransactionIds(transactionTable.id, transactionIds)
                        },
                        orderBy: (transaction, { desc: descFn }) => [descFn(transaction.operatedAt), descFn(transaction.id)],
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

            getRunwaySeriesQuery: (
                filters: TransactionFilterInterface,
                defaultInstrumentId: number,
                months: number,
                isCryptoIncluded: boolean
            ) =>
                Db.query(db => {
                    const monthSql = buildRunwayMonthSql();

                    return buildLedgerEntriesQuery(db, { month: monthSql.as('month'), ...buildIncomeExpenseFields(defaultInstrumentId) })
                        .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                        .where(buildRunwayWhere(filters, months, isCryptoIncluded))
                        .groupBy(monthSql)
                        .orderBy(monthSql);
                }),

            // eslint-disable-next-line @typescript-eslint/max-params -- Runway drivers keep the mandated positional signature (filters, defaultInstrumentId, dimension, months, language, isCryptoIncluded)
            getRunwayDriverSeriesQuery: (
                filters: TransactionFilterInterface,
                defaultInstrumentId: number,
                dimension: RunwayDriverDimensionEnum,
                months: number,
                language: LanguageEnum,
                isCryptoIncluded: boolean
            ) =>
                Db.query(db =>
                    dimension === RunwayDriverDimensionEnum.CATEGORY
                        ? buildRunwayCategoryDriverSeriesQuery(
                              db,
                              defaultInstrumentId,
                              language,
                              buildRunwayWhere(filters, months, isCryptoIncluded)
                          )
                        : buildRunwayTagDriverSeriesQuery(db, defaultInstrumentId, buildRunwayWhere(filters, months, isCryptoIncluded))
                ),

            getIncomeByCategoryQuery: (filters: TransactionFilterInterface, defaultInstrumentId: number, language: LanguageEnum) =>
                Db.query(db => buildCategoryBreakdownQuery(db, defaultInstrumentId, language, buildIncomeBreakdownWhere(db, filters))),

            getExpenseByCategoryQuery: (filters: TransactionFilterInterface, defaultInstrumentId: number, language: LanguageEnum) =>
                Db.query(db => buildCategoryBreakdownQuery(db, defaultInstrumentId, language, buildExpenseBreakdownWhere(filters))),

            getIncomeByTagQuery: (filters: TransactionFilterInterface, defaultInstrumentId: number) =>
                Db.query(db => buildTagBreakdownQuery(db, defaultInstrumentId, buildIncomeBreakdownWhere(db, filters))),

            getExpenseByTagQuery: (filters: TransactionFilterInterface, defaultInstrumentId: number) =>
                Db.query(db =>
                    buildTagBreakdownQuery(
                        db,
                        defaultInstrumentId,
                        buildExpenseBreakdownWhere(
                            filters,
                            or(ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER), isNotNull(TransactionTagsEntityTable.tagId))
                        )
                    )
                ),

            getNettedRefundsQuery: (filters: TransactionFilterInterface, defaultInstrumentId: number) =>
                Db.query(db => {
                    const refundTransaction = alias(TransactionEntityTable, 'refund_transaction');

                    return db
                        .select({
                            amount: sql<number>`COALESCE(SUM(${buildEntryBaseValueSql(defaultInstrumentId)}), 0)`.as('amount'),
                            purchasedAt: sql<number | null>`MAX(${TransactionEntityTable.operatedAt})`.as('purchased_at')
                        })
                        .from(TransactionEntryEntityTable)
                        .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                        .innerJoin(refundTransaction, eq(TransactionEntryEntityTable.originalTransactionId, refundTransaction.id))
                        .where(
                            and(
                                transactionFilters.buildFilterWhere({ ...filters, date: null }),
                                eq(TransactionEntityTable.consolidationType, TransactionConsolidationTypeEnum.REFUND),
                                eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.DEBIT),
                                isNull(TransactionEntryEntityTable.deletedAt),
                                ...(isDefined(filters.date?.from) ? [gte(refundTransaction.operatedAt, filters.date.from)] : []),
                                ...(isDefined(filters.date?.to) ? [lte(refundTransaction.operatedAt, filters.date.to)] : []),
                                or(
                                    isDefined(filters.date?.from) ? lt(TransactionEntityTable.operatedAt, filters.date.from) : sql`0`,
                                    isDefined(filters.date?.to) ? gt(TransactionEntityTable.operatedAt, filters.date.to) : sql`0`
                                )
                            )
                        );
                }),

            getIncomeTransactionsQuery: (filters: TransactionFilterInterface) =>
                Db.query(db =>
                    buildSpendingTransactionIdsQuery(db, transactionFilters.buildFilterWhere(filters), TransactionTypeEnum.INCOME)
                ),

            getExpenseTransactionsQuery: (filters: TransactionFilterInterface) =>
                Db.query(db =>
                    buildSpendingTransactionIdsQuery(db, transactionFilters.buildFilterWhere(filters), TransactionTypeEnum.EXPENSE)
                )
        };
    })
}) {
    static readonly layer = Layer.effect(StatisticsRepository, StatisticsRepository.make);
}
