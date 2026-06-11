/* eslint-disable max-lines -- File owns the single multi-stage statistics SQL aggregation pipeline that must stay together */
import { SQL, and, desc, eq, getTableColumns, inArray, ne, or, sql } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { buildTranslatedCategoryRelation } from '../../@generic/util/build-translated-category-relation.util';
import {
    getDirectExchangeRateSql,
    getHistoricalExchangeRateSql,
    getInverseExchangeRateSql,
    getInverseHistoricalExchangeRateSql
} from '../../@generic/util/get-exchange-rate-sql.util';
import { AccountAssociationEnum } from '../../account/enum/account-association.enum';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { DefaultCategoryTranslationEntityTable } from '../../category-translation/table/default-category-translation-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionAssociationEnum } from '../../transaction/enum/transaction-association.enum';
import { TransactionConsolidationTypeEnum } from '../../transaction/enum/transaction-consolidation-type.enum';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionFilterInterface } from '../../transaction/interface/transaction-filter.interface';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryAssociationEnum } from '../../transaction-entry/enum/transaction-entry-association.enum';
import { TransactionEntryKindEnum } from '../../transaction-entry/enum/transaction-entry-kind.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsAssociationEnum } from '../../transaction-tags/enum/transaction-tags-association.enum';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { StatisticsFilterInterface } from '../interface/statistics-filter.interface';

export class StatisticsRepository extends BaseTransactionFilterRepository {
    getTransactions(filters: StatisticsFilterInterface, limit: number, language: LanguageEnum) {
        const transactionIds = this.buildStatisticsTransactionIdsQuery(filters);

        return this.db.query.TransactionEntityTable.findMany({
            /* jscpd:ignore-start */
            with: {
                [TransactionAssociationEnum.ENTRIES]: {
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
                [TransactionAssociationEnum.FROM_ACCOUNT]: true,
                [TransactionAssociationEnum.TO_ACCOUNT]: true
            },
            /* jscpd:ignore-end */
            where: inArray(TransactionEntityTable.id, transactionIds),
            orderBy: (transaction, { desc: descFn }) => [descFn(transaction.operatedAt)],
            limit
        });
    }

    getTotalIncomeAndExpenseQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        const baseWhere = this.buildStatisticsWhere(filters);

        return this.db
            .select({
                income: sql<number>`
                    COALESCE(SUM(CASE
                        WHEN ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
                             AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
                        THEN 0
                        WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
                             AND ${TransactionEntityTable.type} != ${TransactionTypeEnum.TRANSFER}
                             AND ${AccountEntityTable.type} != ${AccountTypeEnum.DEBT}
                        THEN ${this.buildEntryBaseValueSql(defaultInstrumentId)}
                        ELSE 0
                    END), 0)
                `.as('income'),
                expense: sql<number>`
                    COALESCE(SUM(CASE
                        WHEN ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
                             AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
                             AND ${AccountEntityTable.type} != ${AccountTypeEnum.DEBT}
                        THEN ${this.buildRefundAdjustedCreditBaseAmountSql(defaultInstrumentId)}
                        WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.FEE}
                             AND ${AccountEntityTable.type} != ${AccountTypeEnum.DEBT}
                        THEN ${this.buildEntryBaseValueSql(defaultInstrumentId)}
                        WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
                             AND ${TransactionEntityTable.type} != ${TransactionTypeEnum.TRANSFER}
                             AND ${AccountEntityTable.type} != ${AccountTypeEnum.DEBT}
                        THEN ${this.buildEntryBaseValueSql(defaultInstrumentId)}
                        ELSE 0
                    END), 0)
                `.as('expense')
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .where(and(baseWhere, this.buildLedgerEntryCondition(), this.buildPrimaryEntryCondition()));
    }

    getIncomeByCategoryQuery(filters: TransactionFilterInterface, defaultInstrumentId: number, language: LanguageEnum) {
        return this.buildCategoryBreakdownQuery(
            this.buildTransactionIdsQuery(filters, TransactionTypeEnum.INCOME),
            defaultInstrumentId,
            language
        );
    }

    getExpenseByCategoryQuery(filters: TransactionFilterInterface, defaultInstrumentId: number, language: LanguageEnum) {
        return this.buildExpenseCategoryBreakdownQuery(filters, defaultInstrumentId, language);
    }

    getIncomeByTagQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        return this.buildTagBreakdownQuery(this.buildTransactionIdsQuery(filters, TransactionTypeEnum.INCOME), defaultInstrumentId);
    }

    getExpenseByTagQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        return this.buildExpenseTagBreakdownQuery(filters, defaultInstrumentId);
    }

    getIncomeTransactionsQuery(filters: TransactionFilterInterface) {
        return this.buildStatisticsTransactionsQuery(filters, TransactionTypeEnum.INCOME);
    }

    getExpenseTransactionsQuery(filters: TransactionFilterInterface) {
        return this.buildStatisticsTransactionsQuery(filters, TransactionTypeEnum.EXPENSE);
    }

    /* jscpd:ignore-start */
    private buildStatisticsTransactionsQuery(filters: TransactionFilterInterface, type: TransactionTypeEnum) {
        const baseWhere = this.buildFilterWhere(filters);

        return this.db
            .selectDistinct({ id: TransactionEntityTable.id })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .where(
                and(
                    baseWhere,
                    this.buildLedgerEntryCondition(),
                    this.buildPrimaryEntryCondition(),
                    ne(AccountEntityTable.type, AccountTypeEnum.DEBT),
                    eq(TransactionEntityTable.type, type)
                )
            );
    }

    private buildStatisticsTransactionIdsQuery(filters: StatisticsFilterInterface) {
        const baseWhere = this.buildStatisticsFilterWhere(filters);
        const typeConditions = isDefined(filters.type) ? [eq(TransactionEntityTable.type, filters.type)] : [];

        return this.db
            .selectDistinct({ id: TransactionEntityTable.id })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .where(
                and(
                    baseWhere,
                    this.buildLedgerEntryCondition(),
                    this.buildPrimaryEntryCondition(),
                    ne(AccountEntityTable.type, AccountTypeEnum.DEBT),
                    ...typeConditions
                )
            );
    }
    /* jscpd:ignore-end */

    private buildStatisticsFilterWhere(filters: StatisticsFilterInterface) {
        const dateCondition =
            isDefined(filters.date) && (isDefined(filters.date.from) || isDefined(filters.date.to))
                ? this.buildDateCondition(filters.date)
                : null;
        const conditions = [
            this.buildVisibleTransactionCondition(),
            ...(isDefined(dateCondition) ? [dateCondition] : []),
            ...(isDefined(filters.categoryIds) ? [this.buildCategoryCondition(filters.categoryIds)] : []),
            ...(isDefined(filters.tagIds) ? [this.buildTagCondition(filters.tagIds)] : [])
        ].filter(isDefined);

        // eslint-disable-next-line no-undefined
        return isNotEmptyArray(conditions) ? and(...conditions) : undefined;
    }

    private buildTransactionIdsQuery(filters: TransactionFilterInterface, type: TransactionTypeEnum) {
        const baseWhere = this.buildFilterWhere(filters);

        return this.db
            .selectDistinct({ transactionId: TransactionEntityTable.id })
            .from(TransactionEntityTable)
            .where(and(baseWhere, eq(TransactionEntityTable.type, type)));
    }

    /* jscpd:ignore-start */
    private buildCategoryBreakdownQuery(
        transactionIdsSubquery: ReturnType<typeof this.buildTransactionIdsQuery>,
        defaultInstrumentId: number,
        language: LanguageEnum
    ) {
        const amountSql = this.buildRefundAwareBaseAmountSql(defaultInstrumentId);
        const categoryTitleSql = sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`;

        return this.db
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
                    this.buildLedgerEntryCondition(),
                    this.buildPrimaryEntryCondition(),
                    ne(AccountEntityTable.type, AccountTypeEnum.DEBT)
                )
            )
            .groupBy(TransactionEntryEntityTable.categoryId, categoryTitleSql)
            .orderBy(desc(amountSql));
    }

    private buildTagBreakdownQuery(transactionIdsSubquery: ReturnType<typeof this.buildTransactionIdsQuery>, defaultInstrumentId: number) {
        const amountSql = this.buildRefundAwareBaseAmountSql(defaultInstrumentId);

        return this.db
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
                    this.buildLedgerEntryCondition(),
                    this.buildPrimaryEntryCondition(),
                    ne(AccountEntityTable.type, AccountTypeEnum.DEBT)
                )
            )
            .groupBy(TagEntityTable.id)
            .orderBy(desc(amountSql));
    }

    private buildExpenseCategoryBreakdownQuery(filters: TransactionFilterInterface, defaultInstrumentId: number, language: LanguageEnum) {
        const amountSql = this.buildRefundAwareBaseAmountSql(defaultInstrumentId);
        const categoryTitleSql = sql<string>`COALESCE(${DefaultCategoryTranslationEntityTable.title}, ${CategoryEntityTable.title})`;

        return this.db
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
                    this.buildStatisticsWhere(filters),
                    this.buildExpenseAnalyticsEntryCondition(),
                    this.buildLedgerEntryCondition(),
                    this.buildPrimaryEntryCondition(),
                    ne(AccountEntityTable.type, AccountTypeEnum.DEBT)
                )
            )
            .groupBy(TransactionEntryEntityTable.categoryId, categoryTitleSql)
            .orderBy(desc(amountSql));
    }

    private buildExpenseTagBreakdownQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        const amountSql = this.buildRefundAwareBaseAmountSql(defaultInstrumentId);

        return this.db
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
                    this.buildStatisticsWhere(filters),
                    this.buildExpenseAnalyticsEntryCondition(),
                    this.buildLedgerEntryCondition(),
                    this.buildPrimaryEntryCondition(),
                    ne(AccountEntityTable.type, AccountTypeEnum.DEBT)
                )
            )
            .groupBy(TagEntityTable.id)
            .orderBy(desc(amountSql));
    }
    /* jscpd:ignore-end */

    private buildExpenseAnalyticsEntryCondition() {
        return or(
            eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.FEE),
            and(
                eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
                eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT)
            )
        );
    }

    private buildPrimaryEntryCondition() {
        return eq(TransactionEntryEntityTable.kind, TransactionEntryKindEnum.PRIMARY);
    }

    private buildConversionRateSql(defaultInstrumentId: number, instrumentIdRef: SQL) {
        return sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            ${getInverseHistoricalExchangeRateSql(defaultInstrumentId, instrumentIdRef)},
            1.0
        )`;
    }

    private buildEntryBaseValueSql(defaultInstrumentId: number) {
        return sql<number>`CASE
            WHEN ${TransactionEntryEntityTable.baseInstrumentId} = ${defaultInstrumentId}
            THEN ${TransactionEntryEntityTable.baseAmount}
            ELSE ROUND(${TransactionEntryEntityTable.amount} * ${this.buildConversionRateSql(defaultInstrumentId, sql.raw('accounts.instrument_id'))})
        END`;
    }

    private buildRefundAwareBaseAmountSql(defaultInstrumentId: number) {
        return sql<number>`COALESCE(SUM(CASE
            WHEN ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
                 AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
            THEN ${this.buildRefundAdjustedCreditBaseAmountSql(defaultInstrumentId)}
            ELSE ${this.buildEntryBaseValueSql(defaultInstrumentId)}
        END), 0)`;
    }

    private buildRefundAdjustedCreditBaseAmountSql(defaultInstrumentId: number) {
        return sql<number>`
            ${this.buildEntryBaseValueSql(defaultInstrumentId)}
            - (
                ${this.buildRefundTotalBaseAmountSql(defaultInstrumentId)}
                * ${this.buildEntryBaseValueSql(defaultInstrumentId)}
                / NULLIF(${this.buildLedgerCreditBaseAmountTotalSql(defaultInstrumentId)}, 0)
            )
        `;
    }

    private buildRefundTotalBaseAmountSql(defaultInstrumentId: number) {
        return sql<number>`COALESCE((
            SELECT SUM(CASE
                WHEN refund_entry.base_instrument_id = ${defaultInstrumentId} THEN refund_entry.base_amount
                ELSE ROUND(refund_entry.amount * ${this.buildConversionRateSql(defaultInstrumentId, sql.raw('refund_account.instrument_id'))})
            END)
            FROM transaction_entries refund_entry
            INNER JOIN accounts refund_account ON refund_account.id = refund_entry.account_id
            WHERE refund_entry.transaction_id = ${TransactionEntryEntityTable.transactionId}
              AND refund_entry.original_transaction_id IS NOT NULL
              AND refund_entry.deleted_at IS NULL
              AND refund_entry.type = ${TransactionEntryTypeEnum.DEBIT}
        ), 0)`;
    }

    private buildLedgerCreditBaseAmountTotalSql(defaultInstrumentId: number) {
        return sql<number>`COALESCE((
            SELECT SUM(CASE
                WHEN ledger_credit.base_instrument_id = ${defaultInstrumentId} THEN ledger_credit.base_amount
                ELSE ROUND(ledger_credit.amount * ${this.buildConversionRateSql(defaultInstrumentId, sql.raw('ledger_account.instrument_id'))})
            END)
            FROM transaction_entries ledger_credit
            INNER JOIN accounts ledger_account ON ledger_account.id = ledger_credit.account_id
            WHERE ledger_credit.transaction_id = ${TransactionEntryEntityTable.transactionId}
              AND ledger_credit.original_transaction_id IS NULL
              AND ledger_credit.deleted_at IS NULL
              AND ledger_credit.type = ${TransactionEntryTypeEnum.CREDIT}
        ), 0)`;
    }

    private buildStatisticsWhere(filters: TransactionFilterInterface) {
        const baseWhere = this.buildFilterWhere(filters);

        return and(baseWhere, ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT));
    }
}
