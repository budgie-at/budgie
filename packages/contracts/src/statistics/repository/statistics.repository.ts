import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm';

import { BaseTransactionFilterRepository } from '../../@generic/repository/base-transaction-filter.repository';
import { getDirectExchangeRateSql, getInverseExchangeRateSql } from '../../@generic/util/get-exchange-rate-sql.util';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionFilterInterface } from '../../transaction/interface/transaction-filter.interface';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';

export class StatisticsRepository extends BaseTransactionFilterRepository {
    getTotalIncomeAndExpenseQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        const baseWhere = this.buildStatisticsWhere(filters);
        const exchangeRateSql = this.getExchangeRateSql(defaultInstrumentId);

        return this.db
            .select({
                income: sql<number>`
                    COALESCE(SUM(CASE
                        WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
                             AND ${AccountEntityTable.type} != ${AccountTypeEnum.DEBT}
                        THEN ${TransactionEntryEntityTable.amount} * ${exchangeRateSql}
                        ELSE 0
                    END), 0)
                `.as('income'),
                expense: sql<number>`
                    COALESCE(SUM(CASE
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
            .where(baseWhere);
    }

    getIncomeByCategoryQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        return this.buildCategoryBreakdownQuery(this.buildTransactionIdsQuery(filters, TransactionTypeEnum.INCOME), defaultInstrumentId);
    }

    getExpenseByCategoryQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        return this.buildCategoryBreakdownQuery(this.buildTransactionIdsQuery(filters, TransactionTypeEnum.EXPENSE), defaultInstrumentId);
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

    private buildStatisticsTransactionsQuery(filters: TransactionFilterInterface, type: TransactionTypeEnum) {
        const baseWhere = this.buildFilterWhere(filters);

        return this.db
            .selectDistinct({ id: TransactionEntityTable.id })
            .from(TransactionEntityTable)
            .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .where(and(baseWhere, ne(AccountEntityTable.type, AccountTypeEnum.DEBT), eq(TransactionEntityTable.type, type)));
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
        defaultInstrumentId: number
    ) {
        const exchangeRateSql = this.getExchangeRateSql(defaultInstrumentId);
        const amountSql = sql<number>`COALESCE(SUM(${TransactionEntryEntityTable.amount} * ${exchangeRateSql}), 0)`;

        return this.db
            .select({
                category: CategoryEntityTable,
                amount: amountSql.as('amount')
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .leftJoin(CategoryEntityTable, eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id))
            .where(and(inArray(TransactionEntityTable.id, transactionIdsSubquery), ne(AccountEntityTable.type, AccountTypeEnum.DEBT)))
            .groupBy(TransactionEntryEntityTable.categoryId)
            .orderBy(desc(amountSql));
    }

    private buildTagBreakdownQuery(transactionIdsSubquery: ReturnType<typeof this.buildTransactionIdsQuery>, defaultInstrumentId: number) {
        const exchangeRateSql = this.getExchangeRateSql(defaultInstrumentId);
        const amountSql = sql<number>`COALESCE(SUM(${TransactionEntryEntityTable.amount} * ${exchangeRateSql}), 0)`;

        return this.db
            .select({
                tag: TagEntityTable,
                amount: amountSql.as('amount')
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .innerJoin(TransactionTagsEntityTable, eq(TransactionEntityTable.id, TransactionTagsEntityTable.transactionId))
            .innerJoin(TagEntityTable, eq(TransactionTagsEntityTable.tagId, TagEntityTable.id))
            .where(and(inArray(TransactionEntityTable.id, transactionIdsSubquery), ne(AccountEntityTable.type, AccountTypeEnum.DEBT)))
            .groupBy(TagEntityTable.id)
            .orderBy(desc(amountSql));
    }
    /* jscpd:ignore-end */

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
