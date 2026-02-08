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

const logTime = (label: string, start: number): void => {
    // eslint-disable-next-line no-console
    console.log(`[dbInit] ${label}: ${Math.round(performance.now() - start)}ms`); // eslint-disable-line lingui/no-unlocalized-strings
};

const dbInit = () => {
    const totalStart = performance.now();

    let stepStart = performance.now();
    global.__expoSqliteDb__ ?? (global.__expoSqliteDb__ = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true }));
    logTime('openDatabaseSync', stepStart); // eslint-disable-line lingui/no-unlocalized-strings

    stepStart = performance.now();
    const pin = SecureStore.getItem(PIN_KEY);
    logTime('SecureStore.getItem', stepStart); // eslint-disable-line lingui/no-unlocalized-strings
    if (isNotEmptyString(pin)) {
        stepStart = performance.now();
        global.__expoSqliteDb__.execSync(`PRAGMA key = '${pin}';`);
        logTime('PRAGMA key', stepStart); // eslint-disable-line lingui/no-unlocalized-strings
    }

    stepStart = performance.now();
    global.__expoSqliteDb__.execSync('PRAGMA journal_mode = WAL;'); // eslint-disable-line lingui/no-unlocalized-strings
    logTime('PRAGMA journal_mode', stepStart); // eslint-disable-line lingui/no-unlocalized-strings

    stepStart = performance.now();
    global.__expoSqliteDb__.execSync('PRAGMA busy_timeout = 5000;'); // eslint-disable-line lingui/no-unlocalized-strings
    logTime('PRAGMA busy_timeout', stepStart); // eslint-disable-line lingui/no-unlocalized-strings

    try {
        const extension = SQLite.bundledExtensions['sqlite-vec']; // eslint-disable-line lingui/no-unlocalized-strings

        if (isDefined(extension)) {
            stepStart = performance.now();
            global.__expoSqliteDb__.loadExtensionSync(extension.libPath, extension.entryPoint);
            logTime('loadExtensionSync', stepStart); // eslint-disable-line lingui/no-unlocalized-strings

            stepStart = performance.now();
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS title_embedding_vec USING vec0(embedding float[1536])'); // eslint-disable-line lingui/no-unlocalized-strings
            logTime('CREATE vec0 table', stepStart); // eslint-disable-line lingui/no-unlocalized-strings
        }
    } catch {
        // eslint-disable-next-line no-console
        console.log('Failed to load sqlite-vec extension'); // eslint-disable-line lingui/no-unlocalized-strings
    }

    logTime('dbInit TOTAL', totalStart); // eslint-disable-line lingui/no-unlocalized-strings

    return global.__expoSqliteDb__;
};

const hasTable = (sqliteDb: SQLite.SQLiteDatabase, tableName: string): boolean => {
    const [result] = sqliteDb.getAllSync<{ count: number }>( // eslint-disable-line lingui/no-unlocalized-strings
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='${tableName}'` // eslint-disable-line lingui/no-unlocalized-strings
    );

    return result.count > 0;
};

const getRowCount = (sqliteDb: SQLite.SQLiteDatabase, query: string): number => {
    const [result] = sqliteDb.getAllSync<{ count: number }>(query); // eslint-disable-line lingui/no-unlocalized-strings

    return result.count;
};

export const initPostMigration = (sqliteDb: SQLite.SQLiteDatabase): void => {
    const totalStart = performance.now();

    if (!hasTable(sqliteDb, 'title_embeddings') || !hasTable(sqliteDb, 'title_embedding_vec')) {
        logTime('initPostMigration (no tables, skip)', totalStart); // eslint-disable-line lingui/no-unlocalized-strings

        return;
    }

    let stepStart = performance.now();
    const embeddingCount = getRowCount(sqliteDb, 'SELECT COUNT(*) as count FROM title_embeddings WHERE deleted_at IS NULL'); // eslint-disable-line lingui/no-unlocalized-strings
    const vecCount = getRowCount(sqliteDb, 'SELECT COUNT(*) as count FROM title_embedding_vec'); // eslint-disable-line lingui/no-unlocalized-strings
    logTime(`initPostMigration counts (embeddings=${embeddingCount}, vec=${vecCount})`, stepStart); // eslint-disable-line lingui/no-unlocalized-strings

    if (embeddingCount === vecCount) {
        logTime('initPostMigration TOTAL (in sync, skip)', totalStart); // eslint-disable-line lingui/no-unlocalized-strings

        return;
    }

    stepStart = performance.now();
    sqliteDb.execSync('DELETE FROM title_embedding_vec'); // eslint-disable-line lingui/no-unlocalized-strings
    logTime('initPostMigration DELETE vec', stepStart); // eslint-disable-line lingui/no-unlocalized-strings

    stepStart = performance.now();
    sqliteDb.execSync(
        'INSERT INTO title_embedding_vec(rowid, embedding) SELECT id, embedding FROM title_embeddings WHERE deleted_at IS NULL' // eslint-disable-line lingui/no-unlocalized-strings
    );
    logTime(`initPostMigration INSERT ${embeddingCount} rows`, stepStart); // eslint-disable-line lingui/no-unlocalized-strings

    logTime('initPostMigration TOTAL (rebuilt)', totalStart); // eslint-disable-line lingui/no-unlocalized-strings
};

// eslint-disable-next-line no-console
console.log(`[dbInit] module load START, time=${Math.round(performance.now())}ms`); // eslint-disable-line lingui/no-unlocalized-strings
export let expoDb = dbInit();

/** @deprecated TODO: DELETE ME WHEN DB IS STABLE */
export const __REMOVE_ME_RESET_DB = async () => {
    await expoDb.closeAsync();
    await SQLite.deleteDatabaseAsync(DB_NAME);
    expoDb = dbInit();
};

let drizzleStart = performance.now();
export const db = global.__drizzleDb__ ?? (global.__drizzleDb__ = drizzle(expoDb, { schema }));
logTime('drizzle() init', drizzleStart); // eslint-disable-line lingui/no-unlocalized-strings

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
export const titleEmbeddingRepository = new TitleEmbeddingRepository(db, expoDb);
