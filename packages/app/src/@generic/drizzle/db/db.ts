import * as SQLite from 'expo-sqlite';
import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { ExchangeRateRepository, InstrumentRepository, SettingsRepository } from '@budgie/contracts';
import { DB_NAME } from '../constant/db-name.constant';
import * as schema from './schema'

declare global {
    var __expoSqliteDb__: SQLite.SQLiteDatabase | undefined;
    var __drizzleDb__: ExpoSQLiteDatabase<typeof schema> | undefined;
}

const expoDb = global.__expoSqliteDb__ ?? (global.__expoSqliteDb__ = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true }));

export const db = global.__drizzleDb__ ?? (global.__drizzleDb__ = drizzle(expoDb, { schema }));

export const settingsRepository = new SettingsRepository(db);
export const instrumentRepository = new InstrumentRepository(db);
export const exchangeRateRepository = new ExchangeRateRepository(db);

export type DB = typeof db;
