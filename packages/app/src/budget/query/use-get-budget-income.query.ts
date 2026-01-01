import { TransactionEntityTable, TransactionEntryEntityTable, TransactionEntryTypeEnum } from '@budgie/contracts';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';

interface Props {
    readonly startDate?: Date;
    readonly endDate?: Date;
}

export const useGetBudgetIncomeQuery = ({ startDate, endDate }: Props) => {
    const query = useMemo(() => {
        const conditions = [eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.DEBIT)];

        if (isDefined(startDate)) {
            conditions.push(gte(TransactionEntityTable.operatedAt, startDate));
        }

        if (isDefined(endDate)) {
            conditions.push(lte(TransactionEntityTable.operatedAt, endDate));
        }

        return db
            .select({
                total: sql<number>`COALESCE(SUM(${TransactionEntryEntityTable.amount}), 0)`.as('total')
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(and(...conditions));
    }, [startDate, endDate]);

    const { data, updatedAt, error } = useLiveQuery(query, [startDate, endDate]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, totalIncome: 0, error };
    }

    const totalIncome = data[0]?.total ?? 0;

    return {
        isLoading: false,
        totalIncome,
        error
    };
};

