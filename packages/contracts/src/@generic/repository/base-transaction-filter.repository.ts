import { SQL, and, gte, inArray, isNull, lte } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionCategoryFilterModeEnum } from '../../transaction/enum/transaction-category-filter-mode.enum';
import { TransactionFilterInterface } from '../../transaction/interface/transaction-filter.interface';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { DateRangeInterface } from '../interface/date-range.interface';
import { DB } from '../type/db.type';

export abstract class BaseTransactionFilterRepository {
    constructor(protected db: DB) {}

    /* jscpd:ignore-start */
    protected buildFilterWhere({ tagIds, categoryIds, categoryMode, accountIds, date }: TransactionFilterInterface) {
        const categoryCondition = this.buildTransactionCategoryCondition(categoryMode, categoryIds);
        const conditions: SQL[] = [
            ...this.buildAccountCondition(accountIds),
            ...(isDefined(categoryCondition) ? [categoryCondition] : []),
            ...(isNotEmptyArray(tagIds) ? [this.buildTagCondition(tagIds)] : []),
            ...(isDefined(date) ? [this.buildDateCondition(date)] : [])
        ].filter(isDefined);

        // eslint-disable-next-line no-undefined
        return isNotEmptyArray(conditions) ? and(...conditions) : undefined;
    }
    /* jscpd:ignore-end */

    protected buildTransactionCategoryCondition(categoryMode: TransactionCategoryFilterModeEnum, categoryIds: number[] | null) {
        if (categoryMode === TransactionCategoryFilterModeEnum.UNCATEGORIZED) {
            return this.buildUncategorizedCondition();
        }

        if (categoryMode === TransactionCategoryFilterModeEnum.SELECTED && isNotEmptyArray(categoryIds)) {
            return this.buildSelectedCategoryCondition(categoryIds);
        }

        return null;
    }

    protected buildCategoryCondition(categoryIds: number[]) {
        if (!isNotEmptyArray(categoryIds)) {
            return this.buildUncategorizedCondition();
        }

        return this.buildSelectedCategoryCondition(categoryIds);
    }

    protected buildTagCondition(tagIds: number[]) {
        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionTagsEntityTable.transactionId })
                .from(TransactionTagsEntityTable)
                .where(inArray(TransactionTagsEntityTable.tagId, tagIds))
        );
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

    private buildUncategorizedCondition() {
        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionEntryEntityTable.transactionId })
                .from(TransactionEntryEntityTable)
                .where(isNull(TransactionEntryEntityTable.categoryId))
        );
    }

    private buildSelectedCategoryCondition(categoryIds: number[]) {
        return inArray(
            TransactionEntityTable.id,
            this.db
                .select({ transactionId: TransactionEntryEntityTable.transactionId })
                .from(TransactionEntryEntityTable)
                .where(inArray(TransactionEntryEntityTable.categoryId, categoryIds))
        );
    }
}
