import { SQL, and, eq, gte, inArray, isNull, lte, notInArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionEntryKindEnum } from '../../transaction-entry/enum/transaction-entry-kind.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionFilterInterface } from '../../transaction/interface/transaction-filter.interface';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { PRECISION } from '../constant/precision.constant';
import { AmountRangeInterface } from '../interface/amount-range.interface';
import { DateRangeInterface } from '../interface/date-range.interface';
import { DB } from '../type/db.type';
import { getExchangeRateWithHistoricalFallbackSql } from '../util/get-exchange-rate-sql.util';

export abstract class BaseTransactionFilterRepository {
    constructor(protected db: DB) {}

    /* jscpd:ignore-start */
    protected buildFilterWhere(
        { tagIds, categoryIds, accountIds, date, amount }: TransactionFilterInterface,
        defaultInstrumentId?: number
    ) {
        if (isDefined(amount) && !isDefined(defaultInstrumentId)) {
            throw new Error('Default instrument is required for amount filtering');
        }

        const conditions: SQL[] = [
            this.buildVisibleTransactionCondition(),
            ...this.buildAccountCondition(accountIds),
            ...(isDefined(categoryIds) ? [this.buildCategoryCondition(categoryIds)] : []),
            ...(isDefined(tagIds) ? [this.buildTagCondition(tagIds)] : []),
            ...(isDefined(date) ? [this.buildDateCondition(date)] : []),
            ...(isDefined(amount) && isDefined(defaultInstrumentId) ? [this.buildAmountCondition(amount, defaultInstrumentId)] : [])
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

    protected buildAmountCondition({ from, to }: AmountRangeInterface, defaultInstrumentId: number) {
        const transaction = alias(TransactionEntityTable, 'amount_filter_transaction');
        const account = alias(AccountEntityTable, 'amount_filter_account');
        const entryAmountSql = sql<number>`CASE
            WHEN ${TransactionEntryEntityTable.baseInstrumentId} = ${defaultInstrumentId}
            THEN ${TransactionEntryEntityTable.baseAmount}
            WHEN ${account.instrumentId} = ${defaultInstrumentId}
            THEN ${TransactionEntryEntityTable.amount}
            ELSE ROUND(${TransactionEntryEntityTable.amount} * ${getExchangeRateWithHistoricalFallbackSql(defaultInstrumentId, account.instrumentId)})
        END`;
        const countedEntryCondition = sql`(
            (${transaction.type} = ${TransactionTypeEnum.EXPENSE} AND ${TransactionEntryEntityTable.type} IN (${TransactionEntryTypeEnum.CREDIT}, ${TransactionEntryTypeEnum.FEE}))
            OR (${transaction.type} IN (${TransactionTypeEnum.TRANSFER}, ${TransactionTypeEnum.DEBT}) AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.CREDIT})
            OR (${transaction.type} = ${TransactionTypeEnum.INCOME} AND ${TransactionEntryEntityTable.type} = ${TransactionEntryTypeEnum.DEBIT})
            OR ${transaction.type} = ${TransactionTypeEnum.ADJUSTMENT}
        )`;
        const amountSum = sql<number>`SUM(CASE
            WHEN ${countedEntryCondition} THEN ${entryAmountSql}
            ELSE 0 END)`;
        const unresolvedAmountCount = sql<number>`SUM(CASE
            WHEN ${countedEntryCondition} AND ${entryAmountSql} IS NULL THEN 1
            ELSE 0 END)`;

        const havingParts: SQL[] = [
            ...(isDefined(from) ? [gte(amountSum, Math.round(from * PRECISION))] : []),
            ...(isDefined(to) ? [lte(amountSum, Math.round(to * PRECISION))] : [])
        ];

        if (isEmptyArray(havingParts)) {
            // eslint-disable-next-line no-undefined
            return undefined;
        }

        havingParts.push(eq(unresolvedAmountCount, 0));

        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionEntryEntityTable.transactionId })
                .from(TransactionEntryEntityTable)
                .innerJoin(transaction, eq(transaction.id, TransactionEntryEntityTable.transactionId))
                .innerJoin(account, eq(account.id, TransactionEntryEntityTable.accountId))
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
                .where(
                    and(
                        isNull(TransactionEntryEntityTable.categoryId),
                        this.buildLedgerEntryCondition(),
                        eq(TransactionEntryEntityTable.kind, TransactionEntryKindEnum.PRIMARY)
                    )
                )
        );
    }

    private buildSelectedCategoryCondition(categoryIds: number[]) {
        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionEntryEntityTable.transactionId })
                .from(TransactionEntryEntityTable)
                .where(
                    and(
                        inArray(TransactionEntryEntityTable.categoryId, categoryIds),
                        this.buildLedgerEntryCondition(),
                        eq(TransactionEntryEntityTable.kind, TransactionEntryKindEnum.PRIMARY)
                    )
                )
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
