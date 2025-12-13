import { and, eq, gte, inArray, isNull, lte, or, SQL } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { DateRangeInterface } from '../../generic/interface/date-range.interface';
import { DB, TX } from '../../generic/type/db.type';
import { TransactionEntryAssociationEnum } from '../../transaction-entry/enum/transaction-entry-association.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { DEFAULT_TRANSACTION_FILTER } from '../constant/default-transaction-filter.constant';
import { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionFilterInterface } from '../interface/transaction-filter.interface';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { TransactionEntityInterface } from '../entity/transaction-entity.interface';
import { AccountEntityTable } from '../../account/table/account-entity.table';

export class TransactionRepository {
    constructor(private db: DB) {}

    async create(input: TransactionCreateEntityInterface, tx?: TX): Promise<TransactionEntityInterface> {
        const [transaction] = await (tx ?? this.db).insert(TransactionEntityTable).values([input]).returning();

        return transaction;
    }

    getAll(limit = 20, filters: TransactionFilterInterface = DEFAULT_TRANSACTION_FILTER) {
        const where = this.buildWhere(filters);

        return this.db.query.TransactionEntityTable.findMany({
            with: {
                [TransactionAssociationEnum.ENTRIES]: {
                    with: {
                        [TransactionEntryAssociationEnum.ACCOUNT]: true,
                        [TransactionEntryAssociationEnum.CATEGORY]: true
                    }
                },
                [TransactionAssociationEnum.TRANSACTION_TAGS]: true,
                [TransactionAssociationEnum.FROM_ACCOUNT]: true,
                [TransactionAssociationEnum.TO_ACCOUNT]: true
            },
            orderBy: (transaction, { desc }) => [desc(transaction.operatedAt)],
            limit,
            ...(isDefined(where) ? { where } : {})
        });
    }

    private buildWhere({ types, tagIds, categoryIds, accountIds, date }: TransactionFilterInterface) {
        const conditions: SQL[] = [
            ...this.buildAccountCondition(accountIds),
            ...(isNotEmptyArray(types) ? [inArray(TransactionEntityTable.type, types)] : []),
            ...(isNotEmptyArray(categoryIds) ? [this.buildCategoryCondition(categoryIds)] : []),
            ...(isNotEmptyArray(tagIds) ? [this.buildTagCondition(tagIds)] : []),
            ...(isDefined(date) ? [this.buildDateCondition(date)] : [])
        ].filter(isDefined);

        return isNotEmptyArray(conditions) ? and(...conditions) : null;
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
