import { type SQLiteInsertValue, SQLiteTable } from 'drizzle-orm/sqlite-core';

import { testDb } from '../scenario/setup';

export const insertOne = <T extends SQLiteTable>(table: T, values: SQLiteInsertValue<T>): T['$inferSelect'] =>
    testDb.insert(table).values(values).returning().get();
