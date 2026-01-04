/* eslint-disable max-lines */
import { SQL, SQLWrapper, and, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, or, sql } from 'drizzle-orm';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { DateRangeInterface } from '../../@generic/interface/date-range.interface';
import { DB, TX } from '../../@generic/type/db.type';
import { AccountAssociationEnum } from '../../account/enum/account-association.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntryAssociationEnum } from '../../transaction-entry/enum/transaction-entry-association.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { DEFAULT_TRANSACTION_FILTER } from '../constant/default-transaction-filter.constant';
import { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { TransactionFilterInterface } from '../interface/transaction-filter.interface';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { TransactionEntityInterface } from '../entity/transaction-entity.interface';

export class TransactionRepository {
    private transactionRelations = {
        [TransactionAssociationEnum.ENTRIES]: {
            with: {
                [TransactionEntryAssociationEnum.ACCOUNT]: {
                    with: {
                        [AccountAssociationEnum.INSTRUMENT]: true
                    }
                },
                [TransactionEntryAssociationEnum.CATEGORY]: true,
                [TransactionEntryAssociationEnum.MCC_CATEGORY]: true
            }
        },
        [TransactionAssociationEnum.TRANSACTION_TAGS]: true,
        [TransactionAssociationEnum.FROM_ACCOUNT]: true,
        [TransactionAssociationEnum.TO_ACCOUNT]: true
    } as const;

    constructor(private db: DB) {}

    async deleteById(id: number, tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntityTable).where(eq(TransactionEntityTable.id, id));
    }

    getIncomeByCategoryQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        const incomeTransactionIds = this.buildFilteredTransactionIdsQuery(
            filters,
            TransactionTypeEnum.INCOME,
            TransactionEntryTypeEnum.DEBIT
        );

        return this.buildCategoryBreakdownQuery(incomeTransactionIds, defaultInstrumentId);
    }

    getExpenseByCategoryQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        const expenseTransactionIds = this.buildFilteredTransactionIdsQuery(
            filters,
            TransactionTypeEnum.EXPENSE,
            TransactionEntryTypeEnum.CREDIT
        );

        return this.buildCategoryBreakdownQuery(expenseTransactionIds, defaultInstrumentId);
    }

    getIncomeByTagQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        const incomeTransactionIds = this.buildFilteredTransactionIdsQuery(
            filters,
            TransactionTypeEnum.INCOME,
            TransactionEntryTypeEnum.DEBIT
        );

        return this.buildTagBreakdownQuery(incomeTransactionIds, defaultInstrumentId);
    }

    getExpenseByTagQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        const expenseTransactionIds = this.buildFilteredTransactionIdsQuery(
            filters,
            TransactionTypeEnum.EXPENSE,
            TransactionEntryTypeEnum.CREDIT
        );

        return this.buildTagBreakdownQuery(expenseTransactionIds, defaultInstrumentId);
    }

    getTotalIncomeAndExpenseQuery(filters: TransactionFilterInterface, defaultInstrumentId: number) {
        const baseWhere = this.buildWhere(filters);
        const exchangeRateSql = this.getExchangeRateSql(defaultInstrumentId);

        return this.db
            .select({
                income: sql<number>`
                COALESCE(SUM(CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT}
                                  THEN ${TransactionEntryEntityTable.amount} * ${exchangeRateSql} ELSE 0 END), 0)
            `.as('income'),
                expense: sql<number>`
                COALESCE(SUM(CASE WHEN ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT}
                                  THEN ${TransactionEntryEntityTable.amount} * ${exchangeRateSql} ELSE 0 END), 0)
            `.as('expense')
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .where(
                and(
                    // eslint-disable-next-line no-undefined
                    isDefined(baseWhere) ? baseWhere : undefined,
                    ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
                    ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER)
                )
            );
    }

    async create(input: TransactionCreateEntityInterface, tx?: TX): Promise<TransactionEntityInterface> {
        const [transaction] = await this.bulkCreate([input], tx);

        return transaction;
    }

    async bulkCreate(inputs: TransactionCreateEntityInterface[], tx?: TX): Promise<TransactionEntityInterface[]> {
        if (isNotEmptyArray(inputs)) {
            return await (tx ?? this.db).insert(TransactionEntityTable).values(inputs).returning();
        }

        return [];
    }

    async updateById(id: number, input: Partial<TransactionCreateEntityInterface>, tx?: TX): Promise<TransactionEntityInterface> {
        const [transaction] = await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set(input)
            .where(eq(TransactionEntityTable.id, id))
            .returning();

        return transaction;
    }

    getAll(limit = 20, filters: TransactionFilterInterface = DEFAULT_TRANSACTION_FILTER) {
        const where = this.buildWhere(filters);

        return this.db.query.TransactionEntityTable.findMany({
            with: this.transactionRelations,
            orderBy: (transaction, { desc }) => [desc(transaction.operatedAt)],
            limit,
            ...(isDefined(where) ? { where } : {})
        });
    }

    getAllWithOffset(limit: number, offset: number) {
        return this.db.query.TransactionEntityTable.findMany({
            with: { [TransactionAssociationEnum.ENTRIES]: true },
            orderBy: (transaction, { desc }) => [desc(transaction.id)],
            limit,
            offset,
            where: isNull(TransactionEntityTable.deletedAt)
        });
    }

    getById(id: number) {
        return this.db.query.TransactionEntityTable.findFirst({
            where: eq(TransactionEntityTable.id, id),
            with: this.transactionRelations
        });
    }

    async truncate(tx?: TX): Promise<void> {
        await (tx ?? this.db).delete(TransactionEntityTable);
    }

    async findExternalIdsByExternalSource(externalSource: ExternalSourceEnum): Promise<string[]> {
        const results = await this.db
            .select({ externalId: TransactionEntityTable.externalId })
            .from(TransactionEntityTable)
            .where(
                and(
                    eq(TransactionEntityTable.externalSource, externalSource),
                    isNotNull(TransactionEntityTable.externalId),
                    isNull(TransactionEntityTable.deletedAt)
                )
            );

        return results.map(row => row.externalId).filter((id): id is string => id !== null);
    }

    async findByAccountId(accountId: number): Promise<TransactionEntityInterface[]> {
        return await this.db.query.TransactionEntityTable.findMany({
            where: or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId)),
            orderBy: (transaction, { desc }) => [desc(transaction.operatedAt)]
        });
    }

    async getTransactionTimeByAccountId(accountId: number, mode: 'latest' | 'earliest'): Promise<Date | null> {
        const aggregateSql =
            mode === 'latest'
                ? sql<number | null>`MAX(${TransactionEntityTable.operatedAt})`
                : sql<number | null>`MIN(${TransactionEntityTable.operatedAt})`;

        const result = await this.db
            .select({ operatedAt: aggregateSql })
            .from(TransactionEntityTable)
            .where(
                and(
                    or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId)),
                    ne(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT)
                )
            );

        const time = result[0]?.operatedAt;
        if (isPositiveNumber(time)) {
            return new Date(time * 1000);
        }

        return null;
    }

    async archiveByAccountIds(accountIds: number[], tx?: TX): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ deletedAt: new Date() })
            .where(
                and(
                    or(inArray(TransactionEntityTable.toAccountId, accountIds), inArray(TransactionEntityTable.fromAccountId, accountIds)),
                    ne(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER)
                )
            );
    }

    async restoreByAccountIds(accountIds: number[], tx?: TX): Promise<void> {
        await (tx ?? this.db)
            .update(TransactionEntityTable)
            .set({ deletedAt: null })
            .where(or(inArray(TransactionEntityTable.toAccountId, accountIds), inArray(TransactionEntityTable.fromAccountId, accountIds)));
    }

    private buildCategoryBreakdownQuery(transactionIdsSubquery: SQLWrapper, defaultInstrumentId: number) {
        const exchangeRateSql = this.getExchangeRateSql(defaultInstrumentId);

        return this.db
            .select({
                category: CategoryEntityTable,
                amount: sql<number>`
                COALESCE(SUM(${TransactionEntryEntityTable.amount} * ${exchangeRateSql}), 0)
            `.as('amount')
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .leftJoin(CategoryEntityTable, eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id))
            .where(inArray(TransactionEntityTable.id, transactionIdsSubquery))
            .groupBy(TransactionEntryEntityTable.categoryId)
            .orderBy(desc(sql<number>`COALESCE(SUM(${TransactionEntryEntityTable.amount} * ${exchangeRateSql}), 0)`));
    }

    private buildTagBreakdownQuery(transactionIdsSubquery: SQLWrapper, defaultInstrumentId: number) {
        const exchangeRateSql = this.getExchangeRateSql(defaultInstrumentId);

        return this.db
            .select({
                tag: TagEntityTable,
                amount: sql<number>`
                COALESCE(SUM(${TransactionEntryEntityTable.amount} * ${exchangeRateSql}), 0)
            `.as('amount')
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
            .innerJoin(TransactionTagsEntityTable, eq(TransactionEntityTable.id, TransactionTagsEntityTable.transactionId))
            .innerJoin(TagEntityTable, eq(TransactionTagsEntityTable.tagId, TagEntityTable.id))
            .where(inArray(TransactionEntityTable.id, transactionIdsSubquery))
            .groupBy(TagEntityTable.id)
            .orderBy(desc(sql<number>`COALESCE(SUM(${TransactionEntryEntityTable.amount} * ${exchangeRateSql}), 0)`));
    }

    private buildFilteredTransactionIdsQuery(
        filters: TransactionFilterInterface,
        transactionType: TransactionTypeEnum,
        entryType: TransactionEntryTypeEnum
    ) {
        const baseWhere = this.buildWhere(filters);

        return this.db
            .selectDistinct({ transactionId: TransactionEntityTable.id })
            .from(TransactionEntityTable)
            .where(
                and(
                    // eslint-disable-next-line no-undefined
                    isDefined(baseWhere) ? baseWhere : undefined,
                    or(eq(TransactionEntityTable.type, transactionType), this.buildAdjustmentCondition(entryType))
                )
            );
    }

    private buildWhere({ types, tagIds, categoryIds, accountIds, date }: TransactionFilterInterface) {
        const conditions: SQL[] = [
            ...this.buildAccountCondition(accountIds),
            ...(isNotEmptyArray(types) ? [this.buildTypeCondition(types)] : []),
            ...(isNotEmptyArray(categoryIds) ? [this.buildCategoryCondition(categoryIds)] : []),
            ...(isNotEmptyArray(tagIds) ? [this.buildTagCondition(tagIds)] : []),
            ...(isDefined(date) ? [this.buildDateCondition(date)] : [])
        ].filter(isDefined);

        return isNotEmptyArray(conditions) ? and(...conditions) : null;
    }

    private buildTypeCondition(types: TransactionTypeEnum[]) {
        const typeConditions = [
            inArray(TransactionEntityTable.type, types),
            ...(types.includes(TransactionTypeEnum.EXPENSE) ? [this.buildAdjustmentCondition(TransactionEntryTypeEnum.CREDIT)] : []),
            ...(types.includes(TransactionTypeEnum.INCOME) ? [this.buildAdjustmentCondition(TransactionEntryTypeEnum.DEBIT)] : [])
        ].filter(isDefined);

        return isNotEmptyArray(typeConditions) ? or(...typeConditions) : null;
    }

    private buildAdjustmentCondition(type: TransactionEntryTypeEnum) {
        return and(
            eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT),
            inArray(
                TransactionEntityTable.id,
                this.db
                    .select({ transactionId: TransactionEntryEntityTable.transactionId })
                    .from(TransactionEntryEntityTable)
                    .where(eq(TransactionEntryEntityTable.type, type))
            )
        );
    }

    private buildCategoryCondition(categoryIds: number[]) {
        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionEntryEntityTable.transactionId })
                .from(TransactionEntryEntityTable)
                .where(inArray(TransactionEntryEntityTable.categoryId, categoryIds))
        );
    }

    private buildTagCondition(tagIds: number[]) {
        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionTagsEntityTable.transactionId })
                .from(TransactionTagsEntityTable)
                .where(inArray(TransactionTagsEntityTable.tagId, tagIds))
        );
    }

    private buildAccountCondition(accountIds: number[] | null) {
        const baseConditions = [];

        if (isNotEmptyArray(accountIds)) {
            baseConditions.push(
                or(inArray(TransactionEntityTable.fromAccountId, accountIds), inArray(TransactionEntityTable.toAccountId, accountIds))
            );
        }

        return baseConditions;
    }

    private buildDateCondition({ from, to }: DateRangeInterface) {
        const parts: SQL[] = [];

        if (isDefined(from)) {
            parts.push(gte(TransactionEntityTable.operatedAt, from));
        }

        if (isDefined(to)) {
            parts.push(lte(TransactionEntityTable.operatedAt, to));
        }

        return isNotEmptyArray(parts) ? and(...parts) : null;
    }

    private getExchangeRateSql(defaultInstrumentId: number) {
        return sql`COALESCE(
            ${this.getDirectExchangeRateSql(defaultInstrumentId)},
            ${this.getInverseExchangeRateSql(defaultInstrumentId)},
            1.0
        )`;
    }

    private getDirectExchangeRateSql(defaultInstrumentId: number) {
        return sql`
            (
                SELECT ${ExchangeRateEntityTable.rate} * 1.0
                FROM ${ExchangeRateEntityTable}
                WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${AccountEntityTable.instrumentId}
                  AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${defaultInstrumentId}
                  AND ${ExchangeRateEntityTable.deletedAt} IS NULL
                ORDER BY ${ExchangeRateEntityTable.createdAt} DESC
                LIMIT 1
            )
        `;
    }

    private getInverseExchangeRateSql(defaultInstrumentId: number) {
        return sql`
            (
                SELECT 1.0 / ${ExchangeRateEntityTable.rate}
                FROM ${ExchangeRateEntityTable}
                WHERE ${ExchangeRateEntityTable.baseInstrumentId} = ${defaultInstrumentId}
                  AND ${ExchangeRateEntityTable.quoteInstrumentId} = ${AccountEntityTable.instrumentId}
                  AND ${ExchangeRateEntityTable.deletedAt} IS NULL
                ORDER BY ${ExchangeRateEntityTable.createdAt} DESC
                LIMIT 1
            )
        `;
    }
}
