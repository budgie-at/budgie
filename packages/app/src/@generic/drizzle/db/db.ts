import { getLogger } from '@budgie/logger';
import { open } from '@op-engineering/op-sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
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
    RuleActionRepository,
    RuleConditionRepository,
    RuleRepository,
    SettingsRepository,
    StatisticsRepository,
    TagRepository,
    TransactionEmbeddingRepository,
    TransactionEntryRepository,
    TransactionPatternRepository,
    TransactionRepository,
    TransactionRuleRepository,
    TransactionTagsRepository,
    TransferPairRepository
} from '@budgie/contracts';
import { isNotEmptyString } from '@rnw-community/shared';
import * as SecureStore from 'expo-secure-store';

import { PIN_KEY } from '../../../auth/constant/pin-key.constant';
import { DB_NAME } from '../constant/db-name.constant';
import * as schema from './schema';

import type { DB } from '@budgie/contracts';
import type { DatabaseClientInterface } from '@budgie/contracts';
import type { AsyncRemoteCallback, SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';

const logger = getLogger('db');

type DatabaseChangeListener = (tableName: string) => void;

const databaseChangeListeners = new Set<DatabaseChangeListener>();

declare const __DEV__: boolean;

declare global {
    var __opSqliteDb__: DatabaseClientInterface | undefined;
    var __drizzleDb__: DB | undefined;
}

const openDatabase = (): DatabaseClientInterface => {
    const pin = SecureStore.getItem(PIN_KEY);
    const database = open({
        name: DB_NAME,
        ...(isNotEmptyString(pin) && { encryptionKey: pin })
    });

    database.updateHook(({ table }) => {
        databaseChangeListeners.forEach(listener => listener(table));
    });

    return database;
};

export const addDatabaseChangeListener = (listener: DatabaseChangeListener) => {
    databaseChangeListeners.add(listener);

    return { remove: () => databaseChangeListeners.delete(listener) };
};

const createMigrationDatabase = (databaseClient: DatabaseClientInterface): SqliteRemoteDatabase<typeof schema> => {
    const executeDrizzleQuery: AsyncRemoteCallback = async (query, params, method) => {
        const result = await databaseClient.execute(query, params);

        if (method === 'values') {
            return { rows: result.rawRows ?? result.rows.map(row => Object.values(row)) };
        }

        const rows = result.rows.map(row => Object.assign(Object.values(row), row));

        if (method === 'get') {
            return { rows: rows[0] ?? [] };
        }

        return { rows };
    };

    return drizzle(executeDrizzleQuery, { schema });
};

export const createDatabase = (databaseClient: DatabaseClientInterface): DB => {
    return Object.assign(createMigrationDatabase(databaseClient), { $client: databaseClient });
};

const getDatabaseClient = (): DatabaseClientInterface => {
    global.__opSqliteDb__ ?? (global.__opSqliteDb__ = openDatabase());

    return global.__opSqliteDb__;
};

export const clearDatabaseGlobals = (): void => {
    delete global.__opSqliteDb__;
    delete global.__drizzleDb__;
};

export let opSqliteDb = getDatabaseClient();

export const initializeDb = async (): Promise<void> => {
    await opSqliteDb.execute('PRAGMA journal_mode = WAL;');
    await opSqliteDb.execute('PRAGMA busy_timeout = 5000;');
    await opSqliteDb.execute('PRAGMA foreign_keys = ON;');
    await opSqliteDb.execute('PRAGMA synchronous = NORMAL;');
    await opSqliteDb.execute('PRAGMA cache_size = -20000;');
    await opSqliteDb.execute('PRAGMA mmap_size = 268435456;');
    await opSqliteDb.execute('PRAGMA temp_store = MEMORY;');

    await opSqliteDb.execute('CREATE VIRTUAL TABLE IF NOT EXISTS title_embedding_vec USING vec0(embedding float[768])');
    await opSqliteDb.execute('CREATE VIRTUAL TABLE IF NOT EXISTS merchant_embedding_vec USING vec0(embedding float[768])');
    await opSqliteDb.execute('CREATE VIRTUAL TABLE IF NOT EXISTS comment_embedding_vec USING vec0(embedding float[768])');

    logger.log('sqlite:op-ready');
};

export const __REMOVE_ME_RESET_DB = async () => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) {
        return;
    }

    await opSqliteDb.closeAsync();
    opSqliteDb.delete();
    clearDatabaseGlobals();
    opSqliteDb = getDatabaseClient();
};

export const db: DB = global.__drizzleDb__ ?? (global.__drizzleDb__ = createDatabase(opSqliteDb));

export const executeSqlBatch = async (queries: string[]): Promise<void> => {
    await opSqliteDb.executeBatch(queries.map(query => [query]));
};

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
export const transactionRuleRepository = new TransactionRuleRepository(db);
export const ruleRepository = new RuleRepository(db);
export const ruleConditionRepository = new RuleConditionRepository(db);
export const ruleActionRepository = new RuleActionRepository(db);
export const transferPairRepository = new TransferPairRepository(db);
export const refundPairRepository = new RefundPairRepository(db);
