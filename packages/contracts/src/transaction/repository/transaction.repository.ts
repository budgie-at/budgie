import { and, count, eq, gte, lte, or, SQL } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';
import { DateFilterInterface } from '../../generic/interface/date-filter.interface';
import { DB, TX } from '../../generic/type/db.type';
import { TransactionEntryAssociationEnum } from '../../transaction-entry/enum/transaction-entry-association.enum';
import { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionFilterInterface } from '../interface/transaction-filter.interface';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { TransactionEntityInterface } from '../entity/transaction-entity.interface';

export class TransactionRepository {
    constructor(private db: DB) {}

    async create(input: TransactionCreateEntityInterface, tx?: TX): Promise<TransactionEntityInterface> {
        const [transaction] = await (tx ?? this.db).insert(TransactionEntityTable).values([input]).returning();

        return transaction;
    }

    getAll(
        limit = 20,
        filters: TransactionFilterInterface = {
            accountId: null,
            date: null,
            type: null
        }
    ) {
        const where = this.buildWhere(filters);

        return this.db.query.TransactionEntityTable.findMany({
            with: {
                [TransactionAssociationEnum.ENTRIES]: {
                    with: {
                        [TransactionEntryAssociationEnum.ACCOUNT]: true,
                        [TransactionEntryAssociationEnum.CATEGORY]: true
                    }
                },
                [TransactionAssociationEnum.TRANSACTION_TO_TAGS]: true,
                [TransactionAssociationEnum.FROM_ACCOUNT]: true,
                [TransactionAssociationEnum.TO_ACCOUNT]: true
            },
            orderBy: (transaction, { desc }) => [desc(transaction.operatedAt)],
            limit,
            ...(isDefined(where) ? { where } : {})
        });
    }

    count(
        filters: TransactionFilterInterface = {
            accountId: null,
            date: null,
            type: null
        }
    ) {
        const where = this.buildWhere(filters);

        if (isDefined(where)) {
            return this.db.select({ value: count() }).from(TransactionEntityTable).where(where);
        }

        return this.db.select({ value: count() }).from(TransactionEntityTable);
    }

    private buildWhere(filters: TransactionFilterInterface) {
        const conditions: SQL[] = [];

        if (isDefined(filters.type)) {
            conditions.push(eq(TransactionEntityTable.type, filters.type));
        }

        const accountCondition = this.buildAccountCondition(filters);
        if (isDefined(accountCondition)) {
            conditions.push(accountCondition);
        }

        const dateCondition = isDefined(filters.date) ? this.buildDateCondition(filters.date) : null;
        if (isDefined(dateCondition)) {
            conditions.push(dateCondition);
        }

        return isNotEmptyArray(conditions) ? and(...conditions) : null;
    }

    private buildAccountCondition({ accountId }: TransactionFilterInterface) {
        if (!isDefined(accountId)) {
            return null;
        }

        return or(eq(TransactionEntityTable.fromAccountId, accountId), eq(TransactionEntityTable.toAccountId, accountId));
    }

    private buildDateCondition({ from, to }: DateFilterInterface) {
        return and(gte(TransactionEntityTable.operatedAt, from), lte(TransactionEntityTable.operatedAt, to));
    }
}
