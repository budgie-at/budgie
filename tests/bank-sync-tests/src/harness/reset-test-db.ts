import { getTableName, is, sql } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';

import * as schema from '@app/@generic/drizzle/db/schema';

import { testDb } from './setup';

const REFERENCE_TABLES = new Set(['instruments', 'mcc_groups', 'mcc_categories', 'categories', 'settings']);

const MUTABLE_TABLES = Object.values(schema)
    .filter(value => is(value, SQLiteTable))
    .map(getTableName)
    .filter(name => !REFERENCE_TABLES.has(name));

export const resetTestDb = (): void => {
    testDb.run(sql`PRAGMA foreign_keys = OFF`);
    for (const tableName of MUTABLE_TABLES) {
        testDb.run(sql.raw(`DELETE FROM "${tableName}"`));
    }
    testDb.run(sql`DELETE FROM sqlite_sequence WHERE name NOT IN ('instruments', 'mcc_groups', 'mcc_categories', 'categories', 'settings')`);
    testDb.run(sql`PRAGMA foreign_keys = ON`);
};
