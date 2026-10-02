import { sql } from 'drizzle-orm';

import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { SQL } from 'drizzle-orm';

export const insertTransactionTag = (runner: DB, tagId: number, where: SQL | undefined) =>
    runner
        .insert(TransactionTagsEntityTable)
        .select(queryBuilder =>
            queryBuilder
                .select({
                    transactionId: TransactionEntityTable.id,
                    tagId: sql<number>`${tagId}`.as('tag_id'),
                    isPrimary: sql<boolean>`NOT EXISTS (
                        SELECT 1 FROM ${TransactionTagsEntityTable}
                        WHERE ${TransactionTagsEntityTable.transactionId} = ${TransactionEntityTable.id}
                    )`.as('is_primary')
                })
                .from(TransactionEntityTable)
                .where(where)
        )
        .onConflictDoNothing()
        .returning({ transactionId: TransactionTagsEntityTable.transactionId });
