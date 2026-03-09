import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import {
    AccountBalanceRepository,
    AccountRepository,
    BankSyncRepository,
    CategoryRepository,
    CommentEmbeddingRepository,
    ExchangeRateRepository,
    InstrumentRepository,
    MccCategoryRepository,
    MerchantEmbeddingRepository,
    SettingsRepository,
    StatisticsRepository,
    TagRepository,
    TransactionEntryRepository,
    TransactionPatternRepository,
    TransactionRepository,
    TransactionTagsRepository
} from '@budgie/contracts';
import { DB_NAME } from '../constant/db-name.constant';
import * as schema from './schema';
import { isDefined, isNotEmptyString } from '@rnw-community/shared';
import * as SecureStore from 'expo-secure-store';
import { PIN_KEY } from '../../../auth/constant/pin-key.constant';

import type { DB } from '@budgie/contracts';

declare global {
    var __expoSqliteDb__: SQLite.SQLiteDatabase | undefined;
    var __drizzleDb__: DB | undefined;
}

const dbInit = () => {
    global.__expoSqliteDb__ ?? (global.__expoSqliteDb__ = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true }));

    const pin = SecureStore.getItem(PIN_KEY);
    if (isNotEmptyString(pin)) {
        global.__expoSqliteDb__.execSync(`PRAGMA key = '${pin}';`);
    }

    global.__expoSqliteDb__.execSync('PRAGMA journal_mode = WAL;'); // eslint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA busy_timeout = 5000;'); // eslint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA foreign_keys = ON;'); // eslint-disable-line lingui/no-unlocalized-strings

    try {
        console.log('[DB] bundledExtensions:', JSON.stringify(Object.keys(SQLite.bundledExtensions))); // eslint-disable-line no-console, lingui/no-unlocalized-strings
        const extension = SQLite.bundledExtensions['sqlite-vec']; // eslint-disable-line lingui/no-unlocalized-strings
        console.log('[DB] sqlite-vec extension:', JSON.stringify(extension)); // eslint-disable-line no-console, lingui/no-unlocalized-strings

        if (isDefined(extension)) {
            if (isNotEmptyString(extension.libPath)) {
                console.log('[DB] Loading sqlite-vec from:', extension.libPath); // eslint-disable-line no-console, lingui/no-unlocalized-strings
                global.__expoSqliteDb__.loadExtensionSync(extension.libPath, extension.entryPoint);
            } else {
                console.log('[DB] sqlite-vec libPath is null, skipping loadExtensionSync'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            }
            console.log('[DB] Creating vec tables...'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS title_embedding_vec USING vec0(embedding float[768])'); // eslint-disable-line lingui/no-unlocalized-strings
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS merchant_embedding_vec USING vec0(embedding float[768])'); // eslint-disable-line lingui/no-unlocalized-strings
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS comment_embedding_vec USING vec0(embedding float[768])'); // eslint-disable-line lingui/no-unlocalized-strings
            console.log('[DB] Vec tables ready'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
        } else {
            console.log('[DB] sqlite-vec extension NOT found in bundledExtensions'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
        }
    } catch (dbError) {
        console.log('[DB] sqlite-vec init error:', dbError); // eslint-disable-line no-console, lingui/no-unlocalized-strings
    }

    return global.__expoSqliteDb__;
};

export let expoDb = dbInit();

/** @deprecated TODO: DELETE ME WHEN DB IS STABLE */
export const __REMOVE_ME_RESET_DB = async () => {
    await expoDb.closeAsync();
    await SQLite.deleteDatabaseAsync(DB_NAME);
    global.__expoSqliteDb__ = undefined;
    global.__drizzleDb__ = undefined;
    expoDb = dbInit();
};

export const db: DB = global.__drizzleDb__ ?? (global.__drizzleDb__ = drizzle(expoDb, { schema }));

export const tagRepository = new TagRepository(db);
export const accountRepository = new AccountRepository(db);
export const settingsRepository = new SettingsRepository(db);
export const categoryRepository = new CategoryRepository(db);
export const instrumentRepository = new InstrumentRepository(db);
export const transactionRepository = new TransactionRepository(db);
export const exchangeRateRepository = new ExchangeRateRepository(db);
export const accountBalanceRepository = new AccountBalanceRepository(db);
export const transactionTagsRepository = new TransactionTagsRepository(db);
export const transactionEntryRepository = new TransactionEntryRepository(db);
export const bankSyncRepository = new BankSyncRepository(db);
export const mccCategoryRepository = new MccCategoryRepository(db);
export const statisticsRepository = new StatisticsRepository(db);
export const transactionPatternRepository = new TransactionPatternRepository(db);
export const merchantEmbeddingRepository = new MerchantEmbeddingRepository(db);
export const commentEmbeddingRepository = new CommentEmbeddingRepository(db);
