import * as SQLite from 'expo-sqlite';
import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import {
    AccountBalanceRepository,
    AccountRepository,
    CategoryRepository,
    ExchangeRateRepository,
    InstrumentRepository,
    SettingsRepository,
    TagRepository,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionToTagRepository
} from '@budgie/contracts';
import { DB_NAME } from '../constant/db-name.constant';
import * as schema from './schema';

declare global {
    var __expoSqliteDb__: SQLite.SQLiteDatabase | undefined;
    var __drizzleDb__: ExpoSQLiteDatabase<typeof schema> | undefined;
}

const expoDb = global.__expoSqliteDb__ ?? (global.__expoSqliteDb__ = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true }));
export const db = global.__drizzleDb__ ?? (global.__drizzleDb__ = drizzle(expoDb, { schema }));

export const tagRepository = new TagRepository(db);
export const accountRepository = new AccountRepository(db);
export const settingsRepository = new SettingsRepository(db);
export const categoryRepository = new CategoryRepository(db);
export const instrumentRepository = new InstrumentRepository(db);
export const transactionRepository = new TransactionRepository(db);
export const exchangeRateRepository = new ExchangeRateRepository(db);
export const accountBalanceRepository = new AccountBalanceRepository(db);
export const transactionToTagRepository = new TransactionToTagRepository(db);
export const transactionEntryRepository = new TransactionEntryRepository(db);

export type TX = Parameters<Parameters<ExpoSQLiteDatabase<typeof schema>['transaction']>[0]>[0];
