import { TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '../../@generic/drizzle/db/db';

export const useUncategorizedCountQuery = () => {
    const { data } = useLiveQuery(
        db
            .select({ count: sql<number>`COUNT(*)` })
            .from(TransactionEntryEntityTable)
            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
            .where(and(isNull(TransactionEntityTable.deletedAt), isNull(TransactionEntryEntityTable.categoryId)))
    );

    return { count: data[0]?.count ?? 0 };
};
