import { index, int, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { syncIdentityUniqueIndex } from '../../cloud-sync/utils/sync-identity-unique-index.util';
import { withSyncIdentityColumns } from '../../cloud-sync/utils/with-sync-identity-columns.util';

import { AccountEntityTable } from './account-entity.table';

export const AccountExternalIdEntityTable = sqliteTable(
    'account_external_ids',
    {
        ...withSyncIdentityColumns(),
        externalId: text('external_id').notNull(),
        accountId: int('account_id', { mode: 'number' })
            .notNull()
            .references(() => AccountEntityTable.id, { onDelete: 'cascade' })
    },
    table => [
        primaryKey({ columns: [table.syncZone, table.externalId] }),
        syncIdentityUniqueIndex('account_external_ids', table),
        index('account_external_ids_account_idx').on(table.accountId)
    ]
);
