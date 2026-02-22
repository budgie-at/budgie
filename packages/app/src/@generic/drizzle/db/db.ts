import * as SQLite from 'expo-sqlite';
import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
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

declare global {
    var __expoSqliteDb__: SQLite.SQLiteDatabase | undefined;
    var __drizzleDb__: ExpoSQLiteDatabase<typeof schema> | undefined;
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
        const extension = SQLite.bundledExtensions['sqlite-vec']; // eslint-disable-line lingui/no-unlocalized-strings

        if (isDefined(extension)) {
            global.__expoSqliteDb__.loadExtensionSync(extension.libPath, extension.entryPoint);
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS merchant_embedding_vec USING vec0(embedding float[768])'); // eslint-disable-line lingui/no-unlocalized-strings
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS comment_embedding_vec USING vec0(embedding float[768])'); // eslint-disable-line lingui/no-unlocalized-strings
        }
    } catch {}

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

export const db = global.__drizzleDb__ ?? (global.__drizzleDb__ = drizzle(expoDb, { schema }));

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
export const merchantEmbeddingRepository = new MerchantEmbeddingRepository(db, expoDb);
export const commentEmbeddingRepository = new CommentEmbeddingRepository(db, expoDb);
