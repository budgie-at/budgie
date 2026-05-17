import { SQL, and, gte, inArray, isNull, lte, notInArray } from 'drizzle-orm';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionFilterInterface } from '../../transaction/interface/transaction-filter.interface';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { DateRangeInterface } from '../interface/date-range.interface';
import { DB } from '../type/db.type';

export abstract class BaseTransactionFilterRepository {
    constructor(protected db: DB) {}

    /* jscpd:ignore-start */
    protected buildFilterWhere({ tagIds, categoryIds, accountIds, date }: TransactionFilterInterface) {
        const conditions: SQL[] = [
            this.buildVisibleTransactionCondition(),
            ...this.buildAccountCondition(accountIds),
            ...(isDefined(categoryIds) ? [this.buildCategoryCondition(categoryIds)] : []),
            ...(isDefined(tagIds) ? [this.buildTagCondition(tagIds)] : []),
            ...(isDefined(date) ? [this.buildDateCondition(date)] : [])
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

    protected buildVisibleTransactionCondition() {
        return and(isNull(TransactionEntityTable.deletedAt), isNull(TransactionEntityTable.consolidationParentTransactionId));
    }

    protected buildLedgerEntryCondition() {
        return isNull(TransactionEntryEntityTable.originalTransactionId);
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
                        isNull(TransactionEntryEntityTable.deletedAt)
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
