import { sql } from 'drizzle-orm';

import { SettingsEntityTable } from '../../settings/table/settings-entity.table';

export const CURRENT_CLOUD_USER_SQL = sql`(SELECT ${SettingsEntityTable.cloudUserRecordName} FROM ${SettingsEntityTable} ORDER BY ${SettingsEntityTable.id} LIMIT 1)`;
