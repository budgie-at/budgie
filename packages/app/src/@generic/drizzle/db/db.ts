import * as SQLite from 'expo-sqlite';
import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import {
    AccountBalanceRepository,
    AccountRepository,
    AccountService,
    CategoryRepository,
    ExchangeRateRepository,
    InstrumentRepository,
    SettingsRepository,
    TagRepository,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionService,
    TransactionTagsRepository
} from '@budgie/contracts';
import { DB_NAME } from '../constant/db-name.constant';
import * as schema from './schema';
import { isNotEmptyString } from '@rnw-community/shared';
import { authService } from '../../../auth/service/auth.service';

declare global {
    var __expoSqliteDb__: SQLite.SQLiteDatabase | undefined;
    var __drizzleDb__: ExpoSQLiteDatabase<typeof schema> | undefined;
}

const dbInit = () => {
    global.__expoSqliteDb__ ?? (global.__expoSqliteDb__ = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true }));

    authService.getPin().then(pin => {
        if (isNotEmptyString(pin)) {
            expoDb.execSync(`PRAGMA key = '${pin}';`);
        }
    });

    return global.__expoSqliteDb__;
};

/** @deprecated TODO: DELETE ME WHEN DB IS STABLE */
export const __REMOVE_ME_RESET_DB = async () => {
    await global.__expoSqliteDb__?.closeAsync();
    await SQLite.deleteDatabaseAsync(DB_NAME);
    global.__expoSqliteDb__ ?? (global.__expoSqliteDb__ = SQLite.openDatabaseSync(DB_NAME, { enableChangeListener: true }));
};

export const expoDb = dbInit();

export const db = global.__drizzleDb__ ?? (global.__drizzleDb__ = drizzle(expoDb, { schema }));

export const tagRepository = new TagRepository(db);
export const accountService = new AccountService(db);
export const accountRepository = new AccountRepository(db);
export const settingsRepository = new SettingsRepository(db);
export const categoryRepository = new CategoryRepository(db);
export const transactionService = new TransactionService(db);
export const instrumentRepository = new InstrumentRepository(db);
export const transactionRepository = new TransactionRepository(db);
export const exchangeRateRepository = new ExchangeRateRepository(db);
export const accountBalanceRepository = new AccountBalanceRepository(db);
export const transactionTagsRepository = new TransactionTagsRepository(db);
export const transactionEntryRepository = new TransactionEntryRepository(db);

