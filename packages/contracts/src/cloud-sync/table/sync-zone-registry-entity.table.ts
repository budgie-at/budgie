import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { CURRENT_TIMESTAMP } from '../../@generic/constant/current-timestamp.constant';
import { convertEnumToDrizzleEnum } from '../../@generic/utils/convert-enum-to-drizzle-enum.util';
import { SyncDatabaseScopeEnum } from '../enum/sync-database-scope.enum';
import { SyncZoneRoleEnum } from '../enum/sync-zone-role.enum';

export const SyncZoneRegistryEntityTable = sqliteTable('sync_zone_registry', {
    id: int({ mode: 'number' }).primaryKey({ autoIncrement: true }),
    zoneLabel: text('zone_label').notNull().unique(),
    zoneName: text('zone_name').notNull(),
    ownerName: text('owner_name').notNull(),
    databaseScope: text('database_scope', { enum: convertEnumToDrizzleEnum(SyncDatabaseScopeEnum) })
        .$type<SyncDatabaseScopeEnum>()
        .notNull(),
    role: text('role', { enum: convertEnumToDrizzleEnum(SyncZoneRoleEnum) })
        .$type<SyncZoneRoleEnum>()
        .notNull(),
    shareRecordName: text('share_record_name'),
    createdAt: int('created_at', { mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP),
    updatedAt: int('updated_at', { mode: 'timestamp' }).notNull().default(CURRENT_TIMESTAMP)
});
