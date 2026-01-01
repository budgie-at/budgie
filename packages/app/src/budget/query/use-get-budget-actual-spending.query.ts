import { TransactionEntityTable, TransactionEntryEntityTable, TransactionEntryTypeEnum } from '@budgie/contracts';
import { and, eq, gte, inArray, isNotNull, lte, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';

interface Props {
    readonly categoryIds: number[];
    readonly startDate?: Date;
    readonly endDate?: Date;
}

export const useGetBudgetActualSpendingQuery = ({ categoryIds, startDate, endDate }: Props) => {
    const query = useMemo(() => {
        if (!isNotEmptyArray(categoryIds)) {
            return db
                .select({ total: sql<number>`0`.as('total') })
                .from(TransactionEntryEntityTable)
                .where(sql`1 = 0`);
        }

        const conditions = [
            isNotNull(TransactionEntryEntityTable.categoryId),
            inArray(TransactionEntryEntityTable.categoryId, categoryIds),
            eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT)
        ];

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
    }, [categoryIds, startDate, endDate]);

    const { data, updatedAt, error } = useLiveQuery(query, [categoryIds, startDate, endDate]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, totalSpent: 0, error };
    }

    const totalSpent = data[0]?.total ?? 0;

    return {
        isLoading: false,
        totalSpent,
        error
    };
};
