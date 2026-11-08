import { sql } from 'drizzle-orm';
import { check, int, sqliteTable } from 'drizzle-orm/sqlite-core';

export const SyncApplyStateEntityTable = sqliteTable(
    'sync_apply_state',
    {
        id: int({ mode: 'number' }).primaryKey(),
        isApplying: int('is_applying', { mode: 'boolean' }).notNull().default(false)
    },
    table => [check('sync_apply_state_single_row', sql`${table.id} = 1`)]
);
