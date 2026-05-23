import { and, desc, eq, getTableColumns, inArray, ne, sql } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { buildTranslatedCategoryRelation } from '../../@generic/util/build-translated-category-relation.util';
import { getDirectExchangeRateSql, getInverseExchangeRateSql } from '../../@generic/util/get-exchange-rate-sql.util';
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
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsAssociationEnum } from '../../transaction-tags/enum/transaction-tags-association.enum';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { StatisticsFilterInterface } from '../interface/statistics-filter.interface';

/* eslint-disable max-lines -- StatisticsRepository owns multiple cohesive SQL aggregation pipelines (income/expense × category/tag) that share private helpers; splitting would fragment a single logical SQL surface. */

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
        const exchangeRateSql = this.getExchangeRateSql(defaultInstrumentId);

        return this.db
            .select({
                income: sql<number>`
                    COALESCE(SUM(CASE
                        WHEN ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
                             AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
                        THEN 0
                        WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
                             AND ${AccountEntityTable.type} != ${AccountTypeEnum.DEBT}
                        THEN ${TransactionEntryEntityTable.amount} * ${exchangeRateSql}
                        ELSE 0
                    END), 0)
                `.as('income'),
                expense: sql<number>`
                    COALESCE(SUM(CASE
                        WHEN ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
                             AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
                             AND ${AccountEntityTable.type} != ${AccountTypeEnum.DEBT}
                        THEN ${this.buildRefundAdjustedCreditAmountSql()} * ${exchangeRateSql}
                        WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
                             AND ${AccountEntityTable.type} != ${AccountTypeEnum.DEBT}
                        THEN ${TransactionEntryEntityTable.amount} * ${exchangeRateSql}
                        ELSE 0
                    END), 0)
                `.as('expense')
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .where(and(baseWhere, this.buildLedgerEntryCondition()));
    }

    getIncomeByCategoryQuery(filters: TransactionFilterInterface, defaultInstrumentId: number, language: LanguageEnum) {
        return this.buildCategoryBreakdownQuery(
            this.buildTransactionIdsQuery(filters, TransactionTypeEnum.INCOME),
            defaultInstrumentId,
            language
        );
    }

    getExpenseByCategoryQuery(filters: TransactionFilterInterface, defaultInstrumentId: number, language: LanguageEnum) {
        return this.buildCategoryBreakdownQuery(
            this.buildTransactionIdsQuery(filters, TransactionTypeEnum.EXPENSE),
            defaultInstrumentId,
            language
        );
    }

    getIncomeByTagQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        return this.buildTagBreakdownQuery(this.buildTransactionIdsQuery(filters, TransactionTypeEnum.INCOME), defaultInstrumentId);
    }

    getExpenseByTagQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        return this.buildTagBreakdownQuery(this.buildTransactionIdsQuery(filters, TransactionTypeEnum.EXPENSE), defaultInstrumentId);
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
            .where(and(baseWhere, this.buildLedgerEntryCondition(), ne(AccountEntityTable.type, AccountTypeEnum.DEBT), ...typeConditions));
    }
    /* jscpd:ignore-end */

    private buildStatisticsFilterWhere(filters: StatisticsFilterInterface) {
        const dateCondition =
            isDefined(filters.date) && (isDefined(filters.date.from) || isDefined(filters.date.to))
                ? this.buildDateCondition(filters.date)
                : null;
        const conditions = [
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
        const exchangeRateSql = this.getExchangeRateSql(defaultInstrumentId);
        const amountSql = this.buildRefundAwareAmountSql(exchangeRateSql);
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
                    ne(AccountEntityTable.type, AccountTypeEnum.DEBT)
                )
            )
            .groupBy(TransactionEntryEntityTable.categoryId, categoryTitleSql)
            .orderBy(desc(amountSql));
    }

    private buildTagBreakdownQuery(transactionIdsSubquery: ReturnType<typeof this.buildTransactionIdsQuery>, defaultInstrumentId: number) {
        const exchangeRateSql = this.getExchangeRateSql(defaultInstrumentId);
        const amountSql = this.buildRefundAwareAmountSql(exchangeRateSql);

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
                    ne(AccountEntityTable.type, AccountTypeEnum.DEBT)
                )
            )
            .groupBy(TagEntityTable.id)
            .orderBy(desc(amountSql));
    }
    /* jscpd:ignore-end */

    private buildRefundAwareAmountSql(exchangeRateSql: ReturnType<typeof this.getExchangeRateSql>) {
        return sql<number>`COALESCE(SUM(CASE
            WHEN ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
                 AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
            THEN ${this.buildRefundAdjustedCreditAmountSql()} * ${exchangeRateSql}
            ELSE ${TransactionEntryEntityTable.amount} * ${exchangeRateSql}
        END), 0)`;
    }

    private buildRefundAdjustedCreditAmountSql() {
        return sql<number>`
            ${TransactionEntryEntityTable.amount}
            - (
                ${this.buildRefundTotalSql()}
                * ${TransactionEntryEntityTable.amount}
                / NULLIF(${this.buildLedgerCreditTotalSql()}, 0)
            )
        `;
    }

    private buildRefundTotalSql() {
        return sql<number>`COALESCE((
            SELECT SUM(refund_entry.amount)
            FROM transaction_entries refund_entry
            WHERE refund_entry.transaction_id = ${TransactionEntryEntityTable.transactionId}
              AND refund_entry.original_transaction_id IS NOT NULL
              AND refund_entry.deleted_at IS NULL
              AND refund_entry.type = ${TransactionEntryTypeEnum.DEBIT}
        ), 0)`;
    }

    private buildLedgerCreditTotalSql() {
        return sql<number>`COALESCE((
            SELECT SUM(ledger_credit.amount)
            FROM transaction_entries ledger_credit
            WHERE ledger_credit.transaction_id = ${TransactionEntryEntityTable.transactionId}
              AND ledger_credit.original_transaction_id IS NULL
              AND ledger_credit.deleted_at IS NULL
              AND ledger_credit.type = ${TransactionEntryTypeEnum.CREDIT}
        ), 0)`;
    }

    private buildStatisticsWhere(filters: TransactionFilterInterface) {
        const baseWhere = this.buildFilterWhere(filters);

        return and(
            baseWhere,
            ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
            ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER)
        );
    }

    private getExchangeRateSql(defaultInstrumentId: number) {
        return sql`COALESCE(
            ${getDirectExchangeRateSql(defaultInstrumentId, AccountEntityTable.instrumentId)},
            ${getInverseExchangeRateSql(defaultInstrumentId, AccountEntityTable.instrumentId)},
            1.0
        )`;
    }
}
