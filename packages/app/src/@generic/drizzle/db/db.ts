import * as SQLite from 'expo-sqlite';
import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import {
    AccountBalanceRepository,
    AccountRepository,
    BankSyncRepository,
    CategoryRepository,
    CommentEmbeddingRepository,
    EMBEDDING_DIMENSIONS,
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

const migrateVecDimensions = (sqliteDb: SQLite.SQLiteDatabase): void => {
    const [tableCheck] = sqliteDb.getAllSync<{ count: number }>( // eslint-disable-line lingui/no-unlocalized-strings
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='title_embeddings'" // eslint-disable-line lingui/no-unlocalized-strings
    );

    if (tableCheck.count === 0) {
        return;
    }

    const [wrongDimensions] = sqliteDb.getAllSync<{ count: number }>( // eslint-disable-line lingui/no-unlocalized-strings
        `SELECT COUNT(*) as count FROM title_embeddings WHERE dimensions != ${EMBEDDING_DIMENSIONS}` // eslint-disable-line lingui/no-unlocalized-strings
    );

    if (wrongDimensions.count === 0) {
        return;
    }

    sqliteDb.execSync('DROP TABLE IF EXISTS title_embedding_vec'); // eslint-disable-line lingui/no-unlocalized-strings
    sqliteDb.execSync('DELETE FROM title_embeddings'); // eslint-disable-line lingui/no-unlocalized-strings
};

const dbInit = () => {
    global.__expoSqliteDb__ ?? (global.__expoSqliteDb__ = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true }));

    const pin = SecureStore.getItem(PIN_KEY);
    if (isNotEmptyString(pin)) {
        global.__expoSqliteDb__.execSync(`PRAGMA key = '${pin}';`);
    }

    global.__expoSqliteDb__.execSync('PRAGMA journal_mode = WAL;'); // eslint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA busy_timeout = 5000;'); // eslint-disable-line lingui/no-unlocalized-strings

    try {
        const extension = SQLite.bundledExtensions['sqlite-vec']; // eslint-disable-line lingui/no-unlocalized-strings

        if (isDefined(extension)) {
            global.__expoSqliteDb__.loadExtensionSync(extension.libPath, extension.entryPoint);
            migrateVecDimensions(global.__expoSqliteDb__);
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS title_embedding_vec USING vec0(embedding float[768])'); // eslint-disable-line lingui/no-unlocalized-strings
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS merchant_embedding_vec USING vec0(embedding float[768])'); // eslint-disable-line lingui/no-unlocalized-strings
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS comment_embedding_vec USING vec0(embedding float[768])'); // eslint-disable-line lingui/no-unlocalized-strings
        }
    } catch {
        // no-op: sqlite-vec extension not available
    }

    return global.__expoSqliteDb__;
};

const hasTable = (sqliteDb: SQLite.SQLiteDatabase, tableName: string): boolean => {
    const [result] = sqliteDb.getAllSync<{ count: number }>( // eslint-disable-line lingui/no-unlocalized-strings
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?", // eslint-disable-line lingui/no-unlocalized-strings
        [tableName]
    );

    return result.count > 0;
};

const getRowCount = (sqliteDb: SQLite.SQLiteDatabase, query: string): number => {
    const [result] = sqliteDb.getAllSync<{ count: number }>(query); // eslint-disable-line lingui/no-unlocalized-strings

    return result.count;
};

export const initPostMigration = (sqliteDb: SQLite.SQLiteDatabase): void => {
    if (!hasTable(sqliteDb, 'title_embeddings') || !hasTable(sqliteDb, 'title_embedding_vec')) {
        return;
    }

    const embeddingCount = getRowCount(sqliteDb, 'SELECT COUNT(*) as count FROM title_embeddings WHERE deleted_at IS NULL'); // eslint-disable-line lingui/no-unlocalized-strings
    const vecCount = getRowCount(sqliteDb, 'SELECT COUNT(*) as count FROM title_embedding_vec'); // eslint-disable-line lingui/no-unlocalized-strings

    if (embeddingCount === vecCount) {
        return;
    }

    sqliteDb.execSync('DELETE FROM title_embedding_vec'); // eslint-disable-line lingui/no-unlocalized-strings
    sqliteDb.execSync(
        'INSERT INTO title_embedding_vec(rowid, embedding) SELECT id, embedding FROM title_embeddings WHERE deleted_at IS NULL' // eslint-disable-line lingui/no-unlocalized-strings
    );
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
export const merchantEmbeddingRepository = new MerchantEmbeddingRepository(db, expoDb);
export const commentEmbeddingRepository = new CommentEmbeddingRepository(db, expoDb);
