import * as SQLite from 'expo-sqlite';
import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import {
    AccountBalanceRepository,
    AccountRepository,
    BankSyncRepository,
    CategoryRepository,
    ExchangeRateRepository,
    InstrumentRepository,
    MccCategoryRepository,
    SettingsRepository,
    StatisticsRepository,
    TagRepository,
    TransactionEntryRepository,
    TitleEmbeddingRepository,
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

    const extension = SQLite.bundledExtensions['sqlite-vec']; // eslint-disable-line lingui/no-unlocalized-strings

    if (isDefined(extension)) {
        global.__expoSqliteDb__.loadExtensionSync(extension.libPath, extension.entryPoint);
    }

    return global.__expoSqliteDb__;
};

const hasTable = (sqliteDb: SQLite.SQLiteDatabase, tableName: string): boolean => {
    const [result] = sqliteDb.getAllSync<{ count: number }>( // eslint-disable-line lingui/no-unlocalized-strings
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='${tableName}'` // eslint-disable-line lingui/no-unlocalized-strings
    );

    return result.count > 0;
};

export const initPostMigration = (sqliteDb: SQLite.SQLiteDatabase): void => {
    if (hasTable(sqliteDb, 'transaction_entries')) {
        // eslint-disable-line lingui/no-unlocalized-strings
        sqliteDb.execSync('CREATE INDEX IF NOT EXISTS idx_transaction_entries_transaction_id ON transaction_entries(transaction_id)'); // eslint-disable-line lingui/no-unlocalized-strings
        sqliteDb.execSync('CREATE INDEX IF NOT EXISTS idx_transaction_entries_category_id ON transaction_entries(category_id)'); // eslint-disable-line lingui/no-unlocalized-strings
        sqliteDb.execSync('CREATE INDEX IF NOT EXISTS idx_transaction_entries_account_id ON transaction_entries(account_id)'); // eslint-disable-line lingui/no-unlocalized-strings
    }

    if (hasTable(sqliteDb, 'transactions')) {
        // eslint-disable-line lingui/no-unlocalized-strings
        sqliteDb.execSync('CREATE INDEX IF NOT EXISTS idx_transactions_title ON transactions(title)'); // eslint-disable-line lingui/no-unlocalized-strings
    }

    if (hasTable(sqliteDb, 'title_embeddings')) {
        // eslint-disable-line lingui/no-unlocalized-strings
        sqliteDb.execSync('DROP TABLE IF EXISTS title_embedding_vec'); // eslint-disable-line lingui/no-unlocalized-strings
        sqliteDb.execSync('CREATE VIRTUAL TABLE title_embedding_vec USING vec0(embedding float[1536])'); // eslint-disable-line lingui/no-unlocalized-strings
        sqliteDb.execSync(
            'INSERT OR IGNORE INTO title_embedding_vec(rowid, embedding) SELECT id, embedding FROM title_embeddings WHERE deleted_at IS NULL' // eslint-disable-line lingui/no-unlocalized-strings
        );
        sqliteDb.execSync('CREATE INDEX IF NOT EXISTS idx_title_embeddings_title ON title_embeddings(title)'); // eslint-disable-line lingui/no-unlocalized-strings
    }
};

export let expoDb = dbInit();

/** @deprecated TODO: DELETE ME WHEN DB IS STABLE */
export const __REMOVE_ME_RESET_DB = async () => {
    await expoDb.closeAsync();
    await SQLite.deleteDatabaseAsync(DB_NAME);
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
export const titleEmbeddingRepository = new TitleEmbeddingRepository(db);
