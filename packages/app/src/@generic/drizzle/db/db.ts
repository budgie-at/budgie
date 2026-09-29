import { BudgetCategoryLimitRepository } from '@budgie/budget/query/budget-category-limit-repository';
import { BudgetRepository } from '@budgie/budget/query/budget-repository';
import {
    AtmCashWithdrawalRepository,
    ExistingTransferRepository,
    IbanBridgeTransferRepository,
    RefundPairRepository,
    TransferPairRepository
} from '@budgie/consolidation';
import {
    AccountBalanceRepository,
    AccountRepository,
    BankIntegrationRepository,
    SyncRepository,
    CategoryRepository,
    CommentEmbeddingRepository,
    DebtEventRepository,
    ExchangeRateRepository,
    HistoricalExchangeRateRepository,
    InstrumentDailyMarketPriceRepository,
    InstrumentMarketDataJobRepository,
    InstrumentRepository,
    MccCategoryRepository,
    MerchantEmbeddingRepository,
    RuleActionRepository,
    RuleConditionRepository,
    RuleRepository,
    SettingsRepository,
    StatisticsRepository,
    TagRepository,
    TransactionCategorizeInboxRepository,
    TransactionEmbeddingRepository,
    TransactionEntryPositionRepository,
    TransactionEntryRepository,
    TransactionPatternRepository,
    TransactionRepository,
    TransactionRuleRepository,
    TransactionTagsRepository
} from '@budgie/contracts';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as Effect from 'effect/Effect';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { PIN_KEY } from '../../../auth/constant/pin-key.constant';
import { PIN_SECURE_STORE_OPTIONS } from '../../../auth/constant/pin-secure-store-options.constant';
import { DB_NAME } from '../constant/db-name.constant';

import * as schema from './schema';

import type { DB } from '@budgie/contracts';

declare global {
    var __expoSqliteDb__: SQLite.SQLiteDatabase | undefined;
    var __drizzleDb__: DB | undefined;
}

const readPinOrNullIfKeychainUnavailable = (): string | null => {
    try {
        return SecureStore.getItem(PIN_KEY, PIN_SECURE_STORE_OPTIONS);
    } catch (secureStoreError) {
        Effect.runSync(Effect.logError('secure-store:read-pin-error', { errorMessage: getErrorMessage(secureStoreError) }));

        return null;
    }
};

const dbInit = () => {
    global.__expoSqliteDb__ ?? (global.__expoSqliteDb__ = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true }));

    const pin = readPinOrNullIfKeychainUnavailable();
    if (isNotEmptyString(pin)) {
        global.__expoSqliteDb__.execSync(`PRAGMA key = '${pin}';`);
    }

    global.__expoSqliteDb__.execSync('PRAGMA journal_mode = WAL;'); // oxlint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA busy_timeout = 5000;'); // oxlint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA foreign_keys = ON;'); // oxlint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA synchronous = NORMAL;'); // oxlint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA cache_size = -20000;'); // oxlint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA mmap_size = 268435456;'); // oxlint-disable-line lingui/no-unlocalized-strings
    global.__expoSqliteDb__.execSync('PRAGMA temp_store = MEMORY;'); // oxlint-disable-line lingui/no-unlocalized-strings

    try {
        const extension = SQLite.bundledExtensions['sqlite-vec']; // oxlint-disable-line lingui/no-unlocalized-strings

        if (isDefined(extension)) {
            if (isNotEmptyString(extension.libPath)) {
                global.__expoSqliteDb__.loadExtensionSync(extension.libPath, extension.entryPoint);
            }
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS title_embedding_vec USING vec0(embedding float[768])'); // oxlint-disable-line lingui/no-unlocalized-strings
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS merchant_embedding_vec USING vec0(embedding float[768])'); // oxlint-disable-line lingui/no-unlocalized-strings
            global.__expoSqliteDb__.execSync('CREATE VIRTUAL TABLE IF NOT EXISTS comment_embedding_vec USING vec0(embedding float[768])'); // oxlint-disable-line lingui/no-unlocalized-strings
        }
    } catch (dbError) {
        Effect.runSync(Effect.logError('sqlite:vec-init-error', { errorMessage: getErrorMessage(dbError) }));
    }

    return global.__expoSqliteDb__;
};

export const expoDb = dbInit();

export const db: DB = global.__drizzleDb__ ?? (global.__drizzleDb__ = drizzle(expoDb, { schema }));

export const tagRepository = new TagRepository(db);
export const accountRepository = new AccountRepository(db);
export const settingsRepository = new SettingsRepository(db);
export const categoryRepository = new CategoryRepository(db);
export const instrumentRepository = new InstrumentRepository(db);
export const exchangeRateRepository = new ExchangeRateRepository(db);
export const historicalExchangeRateRepository = new HistoricalExchangeRateRepository();
export const instrumentDailyMarketPriceRepository = new InstrumentDailyMarketPriceRepository(db);
export const instrumentMarketDataJobRepository = new InstrumentMarketDataJobRepository(db);
export const accountBalanceRepository = new AccountBalanceRepository(db);
export const syncRepository = new SyncRepository(db);
export const debtEventRepository = new DebtEventRepository(db);
export const bankIntegrationRepository = new BankIntegrationRepository(db);
export const mccCategoryRepository = new MccCategoryRepository(db);
export const statisticsRepository = new StatisticsRepository(db);
export const transactionEmbeddingRepository = new TransactionEmbeddingRepository();
export const transactionEntryRepository = new TransactionEntryRepository();
export const transactionEntryPositionRepository = new TransactionEntryPositionRepository(db);
export const transactionPatternRepository = new TransactionPatternRepository(db);
export const transactionRepository = new TransactionRepository(db);
export const transactionCategorizeInboxRepository = new TransactionCategorizeInboxRepository(db);
export const transactionTagsRepository = new TransactionTagsRepository();
export const merchantEmbeddingRepository = new MerchantEmbeddingRepository();
export const commentEmbeddingRepository = new CommentEmbeddingRepository();
export const transactionRuleRepository = new TransactionRuleRepository(db);
export const ruleRepository = new RuleRepository(db);
export const ruleConditionRepository = new RuleConditionRepository(db);
export const ruleActionRepository = new RuleActionRepository(db);
export const transferPairRepository = new TransferPairRepository();
export const atmCashWithdrawalRepository = new AtmCashWithdrawalRepository();
export const existingTransferRepository = new ExistingTransferRepository();
export const ibanBridgeTransferRepository = new IbanBridgeTransferRepository();
export const refundPairRepository = new RefundPairRepository();
export const budgetRepository = new BudgetRepository(db);
export const budgetCategoryLimitRepository = new BudgetCategoryLimitRepository(db);
