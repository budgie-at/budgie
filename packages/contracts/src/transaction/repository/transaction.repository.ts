import { SQL, and, count, eq, gte, lte, or } from 'drizzle-orm';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { DatePeriodEnum } from '../../generic/enum/date-period.enum';
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
            period: DatePeriodEnum.ALL_TIME,
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
                [TransactionAssociationEnum.TO_ACCOUNT]: true,
            },
            orderBy: (transaction, { desc }) => [desc(transaction.operatedAt)],
            limit,
            ...(isDefined(where) ? { where } : {})
        });
    }

    count(
        filters: TransactionFilterInterface = {
            accountId: null,
            period: DatePeriodEnum.ALL_TIME,
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

        const dateCondition = this.buildDateCondition(filters);
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

    private buildDateCondition({ period }: TransactionFilterInterface) {
        if (period === DatePeriodEnum.ALL_TIME) {
            return null;
        }

        const { from, to } = this.getPeriodRange(period);
        const parts: SQL[] = [];

        if (isDefined(from)) {
            parts.push(gte(TransactionEntityTable.operatedAt, from));
        }
        if (isDefined(to)) {
            parts.push(lte(TransactionEntityTable.operatedAt, to));
        }

        return isNotEmptyArray(parts) ? and(...parts) : null;
    }

    private getPeriodRange(period: DatePeriodEnum) {
        const now = new Date();

        switch (period) {
            case DatePeriodEnum.TODAY:
                return this.getTodayRange(now);
            case DatePeriodEnum.THIS_WEEK:
                return this.getThisWeekRange(now);
            case DatePeriodEnum.THIS_MONTH:
                return this.getThisMonthRange(now);
            case DatePeriodEnum.THIS_YEAR:
                return this.getThisYearRange(now);
            case DatePeriodEnum.ALL_TIME:
            default:
                return { from: null, to: null };
        }
    }

    private startOfDay(date: Date): Date {
        const copy = new Date(date);
        copy.setHours(0, 0, 0, 0);

        return copy;
    }

    private endOfDay(date: Date): Date {
        const copy = new Date(date);
        copy.setHours(23, 59, 59, 999);

        return copy;
    }

    private getTodayRange(now: Date) {
        return {
            from: this.startOfDay(now),
            to: this.endOfDay(now)
        };
    }

    private getThisWeekRange(now: Date) {
        const from = this.startOfDay(now);
        const day = from.getDay();
        const diffToMonday = (day + 6) % 7;
        from.setDate(from.getDate() - diffToMonday);

        const to = this.endOfDay(new Date(from));
        to.setDate(from.getDate() + 6);

        return { from, to };
    }

    private getThisMonthRange(now: Date) {
        const from = this.startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        return { from, to };
    }

    private getThisYearRange(now: Date) {
        const from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

        return { from, to };
    }
}
