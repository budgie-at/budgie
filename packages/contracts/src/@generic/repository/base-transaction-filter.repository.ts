import { SQL, and, eq, gte, inArray, isNull, lte, notInArray } from 'drizzle-orm';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionEntryKindEnum } from '../../transaction-entry/enum/transaction-entry-kind.enum';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionFilterInterface } from '../../transaction/interface/transaction-filter.interface';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
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
        const amountParts: SQL[] = [
            ...(isDefined(from) ? [gte(TransactionEntryEntityTable.amount, Math.round(from * PRECISION))] : []),
            ...(isDefined(to) ? [lte(TransactionEntryEntityTable.amount, Math.round(to * PRECISION))] : [])
        ];

        if (isEmptyArray(amountParts)) {
            // eslint-disable-next-line no-undefined
            return undefined;
        }

        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionEntryEntityTable.transactionId })
                .from(TransactionEntryEntityTable)
                .where(
                    and(
                        this.buildLedgerEntryCondition(),
                        eq(TransactionEntryEntityTable.kind, TransactionEntryKindEnum.PRIMARY),
                        inArray(TransactionEntryEntityTable.type, [TransactionEntryTypeEnum.CREDIT, TransactionEntryTypeEnum.DEBIT]),
                        ...amountParts
                    )
                )
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
