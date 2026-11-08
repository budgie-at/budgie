import { sql } from 'drizzle-orm';
import { index, int, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { syncIdentityUniqueIndex } from '../../cloud-sync/utils/sync-identity-unique-index.util';
import { withSyncIdentityColumns } from '../../cloud-sync/utils/with-sync-identity-columns.util';
import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TagSourceEnum } from '../enum/tag-source.enum';

export const TransactionTagsEntityTable = sqliteTable(
    'transaction_tags',
    {
        ...withSyncIdentityColumns(),
        transactionId: int('transaction_id', { mode: 'number' })
            .references(() => TransactionEntityTable.id, { onDelete: 'cascade' })
            .notNull(),
        tagId: int('tag_id', { mode: 'number' })
            .references(() => TagEntityTable.id, { onDelete: 'cascade' })
            .notNull(),
        isPrimary: int('is_primary', { mode: 'boolean' }).notNull().default(false),
        source: text('source', { enum: convertEnumToDrizzleEnum(TagSourceEnum) })
            .notNull()
            .default(TagSourceEnum.USER)
            .$type<TagSourceEnum>()
    },
    ({ transactionId, tagId, isPrimary, syncZone, syncId }) => [
        syncIdentityUniqueIndex('transaction_tags', { syncZone, syncId }),
        primaryKey({ columns: [transactionId, tagId] }),
        index('transaction_tags_tag_idx').on(tagId),
        uniqueIndex('transaction_tags_primary_idx')
            .on(transactionId)
            .where(sql`${isPrimary} = 1`)
    ]
);
