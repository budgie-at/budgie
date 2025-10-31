import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// Keep singletons across Fast Refresh
declare global {
    var __expoSqliteDb__: SQLite.SQLiteDatabase | undefined;
    var __drizzleDb__: ReturnType<typeof drizzle> | undefined;
}

const expoDb = global.__expoSqliteDb__ ?? (global.__expoSqliteDb__ = SQLite.openDatabaseSync('budgie.db', {enableChangeListener: true}));

export const db = global.__drizzleDb__ ?? (global.__drizzleDb__ = drizzle(expoDb, { schema }));

export type DB = typeof db;
