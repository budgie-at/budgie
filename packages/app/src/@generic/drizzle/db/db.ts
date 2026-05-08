import * as SQLite from 'expo-sqlite';
import { getLogger } from '@budgie/logger';
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
    RefundPairRepository,
    SettingsRepository,
    StatisticsRepository,
    TagRepository,
    TransactionEmbeddingRepository,
    TransactionEntryRepository,
    TransactionPatternRepository,
    TransactionRepository,
    TransactionTagsRepository,
    TransferPairRepository
} from '@budgie/contracts';
import { DB_NAME } from '../constant/db-name.constant';
import * as schema from './schema';
import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';
import * as SecureStore from 'expo-secure-store';
import { PIN_KEY } from '../../../auth/constant/pin-key.constant';

import type { DB } from '@budgie/contracts';

const logger = getLogger('db');

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
    global.__expoSqliteDb__.execSync('PRAGMA synchronous = NORMAL;'); // eslint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA cache_size = -20000;'); // eslint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA mmap_size = 268435456;'); // eslint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA temp_store = MEMORY;'); // eslint-disable-line lingui/no-unlocalized-strings

    try {
        logger.log('sqlite:bundled-extensions', { extensionNames: Object.keys(SQLite.bundledExtensions).join(',') });
        const extension = SQLite.bundledExtensions['sqlite-vec']; // eslint-disable-line lingui/no-unlocalized-strings

        if (isDefined(extension)) {
            logger.log('sqlite:vec-extension', {
                libPath: extension.libPath,
                entryPoint: extension.entryPoint
            });
            if (isNotEmptyString(extension.libPath)) {
                logger.log('sqlite:vec-load', { libPath: extension.libPath });
                global.__expoSqliteDb__.loadExtensionSync(extension.libPath, extension.entryPoint);
            } else {
                logger.log('sqlite:vec-load-skip');
            }
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS title_embedding_vec USING vec0(embedding float[768])'); // eslint-disable-line lingui/no-unlocalized-strings
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS merchant_embedding_vec USING vec0(embedding float[768])'); // eslint-disable-line lingui/no-unlocalized-strings
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS comment_embedding_vec USING vec0(embedding float[768])'); // eslint-disable-line lingui/no-unlocalized-strings
            logger.log('sqlite:vec-tables-ready');
        } else {
            logger.log('sqlite:vec-extension-missing');
        }
    } catch (dbError) {
        logger.error('sqlite:vec-init-error', { errorMessage: getErrorMessage(dbError) });
    }

    return global.__expoSqliteDb__;
};

export let expoDb = dbInit();

/** @deprecated TODO: DELETE ME WHEN DB IS STABLE */
export const __REMOVE_ME_RESET_DB = async () => {
    if (!__DEV__) {
        return;
    }

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
export const exchangeRateRepository = new ExchangeRateRepository(db);
export const accountBalanceRepository = new AccountBalanceRepository(db);
export const bankSyncRepository = new BankSyncRepository(db);
export const mccCategoryRepository = new MccCategoryRepository(db);
export const statisticsRepository = new StatisticsRepository(db);
export const transactionEmbeddingRepository = new TransactionEmbeddingRepository(db);
export const transactionEntryRepository = new TransactionEntryRepository(db);
export const transactionPatternRepository = new TransactionPatternRepository(db);
export const transactionRepository = new TransactionRepository(db);
export const transactionTagsRepository = new TransactionTagsRepository(db);
export const merchantEmbeddingRepository = new MerchantEmbeddingRepository(db);
export const commentEmbeddingRepository = new CommentEmbeddingRepository(db);
export const transferPairRepository = new TransferPairRepository(db);
export const refundPairRepository = new RefundPairRepository(db);
