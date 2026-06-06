import { SQL, and, eq, gte, inArray, isNull, lte, notInArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionFilterInterface } from '../../transaction/interface/transaction-filter.interface';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { PRECISION } from '../constant/precision.constant';
import { AmountRangeInterface } from '../interface/amount-range.interface';
import { DateRangeInterface } from '../interface/date-range.interface';
import { DB } from '../type/db.type';

export abstract class BaseTransactionFilterRepository {
    constructor(protected db: DB) {}

    /* jscpd:ignore-start */
    protected buildFilterWhere({ tagIds, categoryIds, accountIds, date, amount }: TransactionFilterInterface) {
        const conditions: SQL[] = [
            this.buildVisibleTransactionCondition(),
            ...this.buildAccountCondition(accountIds),
            ...(isDefined(categoryIds) ? [this.buildCategoryCondition(categoryIds)] : []),
            ...(isDefined(tagIds) ? [this.buildTagCondition(tagIds)] : []),
            ...(isDefined(date) ? [this.buildDateCondition(date)] : []),
            ...(isDefined(amount) ? [this.buildAmountCondition(amount)] : [])
        ].filter(isDefined);

        // eslint-disable-next-line no-undefined
        return isNotEmptyArray(conditions) ? and(...conditions) : undefined;
    }
    /* jscpd:ignore-end */

    protected buildCategoryCondition(categoryIds: number[]) {
        if (isEmptyArray(categoryIds)) {
            return this.buildUncategorizedCondition();
        }

        return this.buildSelectedCategoryCondition(categoryIds);
    }

    protected buildTagCondition(tagIds: number[]) {
        if (isEmptyArray(tagIds)) {
            return this.buildUntaggedCondition();
        }

        return this.buildSelectedTagCondition(tagIds);
    }

    protected buildAccountCondition(accountIds: number[] | null): SQL[] {
        if (isNotEmptyArray(accountIds)) {
            return [inArray(TransactionEntityTable.fromAccountId, accountIds)];
        }

        return [];
    }

    protected buildDateCondition({ from, to }: DateRangeInterface) {
        const parts: SQL[] = [];

        if (isDefined(from)) {
            parts.push(gte(TransactionEntityTable.operatedAt, from));
        }

        if (isDefined(to)) {
            parts.push(lte(TransactionEntityTable.operatedAt, to));
        }

        // eslint-disable-next-line no-undefined
        return isNotEmptyArray(parts) ? and(...parts) : undefined;
    }

    protected buildAmountCondition({ from, to }: AmountRangeInterface) {
        const transaction = alias(TransactionEntityTable, 'amount_filter_transaction');
        const amountSum = sql<number>`SUM(CASE
            WHEN ${transaction.type} = ${TransactionTypeEnum.EXPENSE} AND ${TransactionEntryEntityTable.type} IN (${TransactionEntryTypeEnum.CREDIT}, ${TransactionEntryTypeEnum.FEE}) THEN ${TransactionEntryEntityTable.amount}
            WHEN ${transaction.type} IN (${TransactionTypeEnum.TRANSFER}, ${TransactionTypeEnum.DEBT}) AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT} THEN ${TransactionEntryEntityTable.amount}
            WHEN ${transaction.type} = ${TransactionTypeEnum.INCOME} AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT} THEN ${TransactionEntryEntityTable.amount}
            WHEN ${transaction.type} = ${TransactionTypeEnum.ADJUSTMENT} THEN ${TransactionEntryEntityTable.amount}
            ELSE 0 END)`;

        const havingParts: SQL[] = [];

        if (isDefined(from)) {
            havingParts.push(gte(amountSum, Math.round(from * PRECISION)));
        }

        if (isDefined(to)) {
            havingParts.push(lte(amountSum, Math.round(to * PRECISION)));
        }

        if (isEmptyArray(havingParts)) {
            // eslint-disable-next-line no-undefined
            return undefined;
        }

        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionEntryEntityTable.transactionId })
                .from(TransactionEntryEntityTable)
                .innerJoin(transaction, eq(transaction.id, TransactionEntryEntityTable.transactionId))
                .where(this.buildLedgerEntryCondition())
                .groupBy(TransactionEntryEntityTable.transactionId)
                .having(and(...havingParts))
        );
    }

    protected buildVisibleTransactionCondition() {
        return and(isNull(TransactionEntityTable.deletedAt), isNull(TransactionEntityTable.consolidationParentTransactionId));
    }

    protected buildLedgerEntryCondition() {
        return and(isNull(TransactionEntryEntityTable.originalTransactionId), isNull(TransactionEntryEntityTable.deletedAt));
    }

    private buildUncategorizedCondition() {
        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionEntryEntityTable.transactionId })
                .from(TransactionEntryEntityTable)
                .where(and(isNull(TransactionEntryEntityTable.categoryId), this.buildLedgerEntryCondition()))
        );
    }

    private buildSelectedCategoryCondition(categoryIds: number[]) {
        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionEntryEntityTable.transactionId })
                .from(TransactionEntryEntityTable)
                .where(and(inArray(TransactionEntryEntityTable.categoryId, categoryIds), this.buildLedgerEntryCondition()))
        );
    }

    private buildUntaggedCondition() {
        return notInArray(
            TransactionEntityTable.id,
            this.db.select({ transactionId: TransactionTagsEntityTable.transactionId }).from(TransactionTagsEntityTable)
        );
    }

    private buildSelectedTagCondition(tagIds: number[]) {
        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionTagsEntityTable.transactionId })
                .from(TransactionTagsEntityTable)
                .where(inArray(TransactionTagsEntityTable.tagId, tagIds))
        );
    }
}
