import { index, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { AccountEntityTable } from './account-entity.table';

export const AccountExternalIdEntityTable = sqliteTable(
    'account_external_ids',
    {
        externalId: text('external_id').primaryKey(),
        accountId: int('account_id', { mode: 'number' })
            .notNull()
            .references(() => AccountEntityTable.id, { onDelete: 'cascade' })
    },
    table => [index('account_external_ids_account_idx').on(table.accountId)]
);
