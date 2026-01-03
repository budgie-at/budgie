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

export interface CategorySpendingInterface {
    readonly categoryId: number;
    readonly total: number;
}

export const useGetSpendingByCategoryQuery = ({ categoryIds, startDate, endDate }: Props) => {
    const query = useMemo(() => {
        if (!isNotEmptyArray(categoryIds)) {
            return db
                .select({
                    categoryId: sql<number>`0`.as('categoryId'),
                    total: sql<number>`0`.as('total')
                })
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
                categoryId: TransactionEntryEntityTable.categoryId,
                total: sql<number>`COALESCE(SUM(${TransactionEntryEntityTable.amount}), 0)`.as('total')
            })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(and(...conditions))
            .groupBy(TransactionEntryEntityTable.categoryId);
    }, [categoryIds, startDate, endDate]);

    const { data, updatedAt, error } = useLiveQuery(query, [categoryIds, startDate, endDate]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, spendingByCategory: [] as CategorySpendingInterface[], error };
    }

    const spendingByCategory: CategorySpendingInterface[] = [];
    for (const item of data) {
        if (isDefined(item.categoryId)) {
            spendingByCategory.push({ categoryId: item.categoryId, total: item.total });
        }
    }

    return {
        isLoading: false,
        spendingByCategory,
        error
    };
};

