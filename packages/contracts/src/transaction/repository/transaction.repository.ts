/* eslint-disable max-lines */
import { SQL, SQLWrapper, and, desc, eq, gte, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { DateRangeInterface } from '../../@generic/interface/date-range.interface';
import { DB, TX } from '../../@generic/type/db.type';
import { AccountAssociationEnum } from '../../account/enum/account-association.enum';
import { ExternalSourceEnum } from '../../account/enum/external-source.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
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
                [TransactionEntryAssociationEnum.CATEGORY]: true
            }
        },
        [TransactionAssociationEnum.TRANSACTION_TAGS]: true,
        [TransactionAssociationEnum.FROM_ACCOUNT]: true,
        [TransactionAssociationEnum.TO_ACCOUNT]: true
    } as const;

    constructor(private db: DB) {}

    getIncomeByCategoryQuery(filters: TransactionFilterInterface) {
        const incomeTransactionIds = this.buildFilteredTransactionIdsQuery(
            filters,
            TransactionTypeEnum.INCOME,
            TransactionEntryTypeEnum.DEBIT
        );

        return this.buildCategoryBreakdownQuery(incomeTransactionIds);
    }

    getExpenseByCategoryQuery(filters: TransactionFilterInterface) {
        const expenseTransactionIds = this.buildFilteredTransactionIdsQuery(
            filters,
            TransactionTypeEnum.EXPENSE,
            TransactionEntryTypeEnum.CREDIT
        );

        return this.buildCategoryBreakdownQuery(expenseTransactionIds);
    }

    getTotalIncomeAndExpenseQuery(filters: TransactionFilterInterface) {
        const baseWhere = this.buildWhere(filters);

        const adjustmentIncomeIds = this.db
            .selectDistinct({ id: TransactionEntryEntityTable.transactionId })
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.DEBIT));

        const adjustmentExpenseIds = this.db
            .selectDistinct({ id: TransactionEntryEntityTable.transactionId })
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT));

        return (
            this.db
                .select({
                    income: sql<number>`
                    COALESCE(SUM(
                        CASE
                            WHEN ${TransactionEntityTable.type} = ${TransactionTypeEnum.INCOME} THEN ${TransactionEntityTable.amount}
                            WHEN ${TransactionEntityTable.type} = ${TransactionTypeEnum.ADJUSTMENT}
                                 AND ${inArray(TransactionEntityTable.id, adjustmentIncomeIds)}
                            THEN ${TransactionEntityTable.amount}
                            ELSE 0
                        END
                    ), 0)
                `,
                    expense: sql<number>`
                    COALESCE(SUM(
                        CASE
                            WHEN ${TransactionEntityTable.type} = ${TransactionTypeEnum.EXPENSE} THEN ${TransactionEntityTable.amount}
                            WHEN ${TransactionEntityTable.type} = ${TransactionTypeEnum.ADJUSTMENT}
                                 AND ${inArray(TransactionEntityTable.id, adjustmentExpenseIds)}
                            THEN ${TransactionEntityTable.amount}
                            ELSE 0
                        END
                    ), 0)
                `
                })
                .from(TransactionEntityTable)
                // eslint-disable-next-line no-undefined
                .where(isDefined(baseWhere) ? baseWhere : undefined)
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

    getById(id: number) {
        return this.db.query.TransactionEntityTable.findFirst({
            where: eq(TransactionEntityTable.id, id),
            with: this.transactionRelations
        });
    }

    async truncate(): Promise<void> {
        await this.db.delete(TransactionEntityTable);
    }

    async findByExternalSource(externalSource: ExternalSourceEnum): Promise<TransactionEntityInterface[]> {
        return await this.db.query.TransactionEntityTable.findMany({
            where: eq(TransactionEntityTable.externalSource, externalSource)
        });
    }

    async findByAccountId(accountId: number): Promise<TransactionEntityInterface[]> {
        return await this.db.query.TransactionEntityTable.findMany({
            where: or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId)),
            orderBy: (transaction, { desc }) => [desc(transaction.operatedAt)]
        });
    }

    async getLatestTransactionTimeByAccountExternalId(externalId: string): Promise<Date | null> {
        const result = await this.db
            .select({ operatedAt: sql<string>`MAX(${TransactionEntityTable.operatedAt})` })
            .from(TransactionEntityTable)
            .innerJoin(
                AccountEntityTable,
                or(
                    eq(TransactionEntityTable.fromAccountId, AccountEntityTable.id),
                    eq(TransactionEntityTable.toAccountId, AccountEntityTable.id)
                )
            )
            .where(
                and(eq(AccountEntityTable.externalId, externalId), sql`${TransactionEntityTable.type} != ${TransactionTypeEnum.ADJUSTMENT}`)
            );

        const time = result[0]?.operatedAt;

        if (!isDefined(time)) {
            return null;
        }

        return new Date(time);
    }

    private buildCategoryBreakdownQuery(transactionIdsSubquery: SQLWrapper) {
        return this.db
            .select({
                category: CategoryEntityTable,
                amount: sql<number>`COALESCE(SUM(${TransactionEntityTable.amount}), 0)`
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .innerJoin(CategoryEntityTable, eq(TransactionEntryEntityTable.categoryId, CategoryEntityTable.id))
            .where(and(inArray(TransactionEntityTable.id, transactionIdsSubquery), isNotNull(TransactionEntryEntityTable.categoryId)))
            .groupBy(CategoryEntityTable.id)
            .orderBy(desc(sql`COALESCE(SUM(${TransactionEntityTable.amount}), 0)`));
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
        const baseConditions = [
            or(
                inArray(
                    TransactionEntityTable.id,
                    this.db
                        .select({ transactionId: TransactionEntityTable.id })
                        .from(TransactionEntityTable)
                        .innerJoin(AccountEntityTable, eq(TransactionEntityTable.fromAccountId, AccountEntityTable.id))
                        .where(isNull(AccountEntityTable.deletedAt))
                ),
                inArray(
                    TransactionEntityTable.id,
                    this.db
                        .select({ transactionId: TransactionEntityTable.id })
                        .from(TransactionEntityTable)
                        .innerJoin(AccountEntityTable, eq(TransactionEntityTable.toAccountId, AccountEntityTable.id))
                        .where(isNull(AccountEntityTable.deletedAt))
                )
            )
        ];

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
}
