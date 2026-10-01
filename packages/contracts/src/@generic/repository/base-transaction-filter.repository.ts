import { SQL, and, eq, gte, inArray, isNotNull, isNull, lte, ne, notInArray, or } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
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

import type { Operators } from 'drizzle-orm';

export class BaseTransactionFilterRepository {
    private static readonly CATEGORIZABLE_TYPES = [TransactionTypeEnum.INCOME, TransactionTypeEnum.EXPENSE];

    private readonly queryBuilder = new QueryBuilder();

    /* jscpd:ignore-start */
    buildFilterWhere({
        tagIds,
        categoryIds,
        accountIds,
        date,
        amount
    }: Pick<TransactionFilterInterface, 'tagIds' | 'categoryIds' | 'accountIds' | 'date' | 'amount'>) {
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

    buildCategoryCondition(categoryIds: number[]) {
        if (isEmptyArray(categoryIds)) {
            return this.buildUncategorizedCondition();
        }

        return this.buildSelectedCategoryCondition(categoryIds);
    }

    buildTagCondition(tagIds: number[]) {
        if (isEmptyArray(tagIds)) {
            return this.buildUntaggedCondition();
        }

        return this.buildSelectedTagCondition(tagIds);
    }

    buildAccountCondition(accountIds: number[] | null): SQL[] {
        if (isNotEmptyArray(accountIds)) {
            const condition = or(
                inArray(TransactionEntityTable.fromAccountId, accountIds),
                inArray(TransactionEntityTable.toAccountId, accountIds),
                inArray(TransactionEntityTable.id, this.buildTransactionIdsByEntryAccountIdsQuery(accountIds)),
                inArray(TransactionEntityTable.id, this.buildTransactionIdsByDebtEventAccountIdsQuery(accountIds))
            );

            return isDefined(condition) ? [condition] : [];
        }

        return [];
    }

    buildDateCondition({ from, to }: DateRangeInterface) {
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

    buildAmountCondition({ from, to }: AmountRangeInterface) {
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
            this.queryBuilder
                .select({ transactionId: TransactionEntryEntityTable.transactionId })
                .from(TransactionEntryEntityTable)
                .where(
                    and(
                        this.buildPrimaryLedgerEntryCondition(),
                        inArray(TransactionEntryEntityTable.type, [TransactionEntryTypeEnum.CREDIT, TransactionEntryTypeEnum.DEBIT]),
                        ...amountParts
                    )
                )
        );
    }

    buildVisibleTransactionCondition() {
        return and(isNull(TransactionEntityTable.deletedAt), isNull(TransactionEntityTable.consolidationParentTransactionId));
    }

    buildVisibleTransactionFilter() {
        return { deletedAt: { isNull: true }, consolidationParentTransactionId: { isNull: true } } as const;
    }

    buildTransactionIdsFilter(condition: SQL | undefined) {
        return {
            RAW: (transactionTable: typeof TransactionEntityTable, { inArray: inTransactionIds }: Operators) =>
                inTransactionIds(
                    transactionTable.id,
                    this.queryBuilder.select({ id: TransactionEntityTable.id }).from(TransactionEntityTable).where(condition)
                )
        };
    }

    buildLedgerEntryFilter() {
        return { originalTransactionId: { isNull: true }, deletedAt: { isNull: true } } as const;
    }

    buildLedgerEntryCondition() {
        return and(isNull(TransactionEntryEntityTable.originalTransactionId), isNull(TransactionEntryEntityTable.deletedAt));
    }

    buildPrimaryLedgerEntryCondition() {
        return and(this.buildLedgerEntryCondition(), eq(TransactionEntryEntityTable.kind, TransactionEntryKindEnum.PRIMARY));
    }

    buildCategorizableEntryCondition() {
        return and(this.buildPrimaryLedgerEntryCondition(), ne(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.FEE));
    }

    buildExpenseAnalyticsEntryCondition() {
        return or(
            eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.FEE),
            and(
                eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
                eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT)
            )
        );
    }

    buildNonDebtAccountCondition() {
        return ne(AccountEntityTable.type, AccountTypeEnum.DEBT);
    }

    buildUncategorizedEntryCondition() {
        return and(
            isNull(TransactionEntryEntityTable.categoryId),
            this.buildCategorizableEntryCondition(),
            this.buildNonDebtAccountCondition()
        );
    }

    buildCategorizableTypeCondition(types: TransactionTypeEnum[] | null) {
        return inArray(
            TransactionEntityTable.type,
            BaseTransactionFilterRepository.CATEGORIZABLE_TYPES.filter(type => !isNotEmptyArray(types) || types.includes(type))
        );
    }

    buildUntaggedCondition() {
        return notInArray(
            TransactionEntityTable.id,
            this.queryBuilder.select({ transactionId: TransactionTagsEntityTable.transactionId }).from(TransactionTagsEntityTable)
        );
    }

    buildTransactionIdsByEntryAccountIdsQuery(accountIds: number[]) {
        return this.queryBuilder
            .select({ transactionId: TransactionEntryEntityTable.transactionId })
            .from(TransactionEntryEntityTable)
            .where(and(inArray(TransactionEntryEntityTable.accountId, accountIds), this.buildLedgerEntryCondition()));
    }

    buildTransactionIdsByDebtEventAccountIdsQuery(accountIds: number[]) {
        return this.queryBuilder
            .select({ transactionId: DebtEventEntityTable.transactionId })
            .from(DebtEventEntityTable)
            .where(
                and(
                    inArray(DebtEventEntityTable.debtAccountId, accountIds),
                    isNotNull(DebtEventEntityTable.transactionId),
                    isNull(DebtEventEntityTable.deletedAt)
                )
            );
    }

    private buildUncategorizedCondition() {
        return and(
            this.buildCategorizableTypeCondition(null),
            inArray(
                TransactionEntityTable.id,
                this.queryBuilder
                    .select({ transactionId: TransactionEntryEntityTable.transactionId })
                    .from(TransactionEntryEntityTable)
                    .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
                    .where(this.buildUncategorizedEntryCondition())
            )
        );
    }

    private buildSelectedCategoryCondition(categoryIds: number[]) {
        return inArray(
            TransactionEntityTable.id,
            this.queryBuilder
                .select({ transactionId: TransactionEntryEntityTable.transactionId })
                .from(TransactionEntryEntityTable)
                .where(and(inArray(TransactionEntryEntityTable.categoryId, categoryIds), this.buildPrimaryLedgerEntryCondition()))
        );
    }

    private buildSelectedTagCondition(tagIds: number[]) {
        return inArray(
            TransactionEntityTable.id,
            this.queryBuilder
                .select({ transactionId: TransactionTagsEntityTable.transactionId })
                .from(TransactionTagsEntityTable)
                .where(inArray(TransactionTagsEntityTable.tagId, tagIds))
        );
    }
}
