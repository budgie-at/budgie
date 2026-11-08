import { sql } from 'drizzle-orm';

import { RANDOM_SYNC_ID_SQL } from '../../cloud-sync/constant/random-sync-id-sql.constant';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TRANSACTION_TAGS_PREFER_USER_SOURCE_CONFLICT } from '../constant/transaction-tags-prefer-user-source-conflict.constant';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { TagSourceEnum } from '../enum/tag-source.enum';
import type { SQL } from 'drizzle-orm';

export const insertTransactionTag = (runner: DB, tagId: number, where: SQL | undefined, source: TagSourceEnum) =>
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
                    )`.as('is_primary'),
                    source: sql<TagSourceEnum>`${source}`.as('source'),
                    syncId: sql<string>`${RANDOM_SYNC_ID_SQL}`.as('sync_id')
                })
                .from(TransactionEntityTable)
                .where(where)
        )
        .onConflictDoUpdate(TRANSACTION_TAGS_PREFER_USER_SOURCE_CONFLICT)
        .returning({ transactionId: TransactionTagsEntityTable.transactionId });
