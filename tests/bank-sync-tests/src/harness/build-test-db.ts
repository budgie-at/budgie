import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as schema from '@app/@generic/drizzle/db/schema';

const here = resolve(fileURLToPath(import.meta.url), '..');
const migrationsFolder = resolve(here, '../../../../packages/app/drizzle');

type TestDb = BetterSQLite3Database<typeof schema>;

export const buildTestDb = (): TestDb => {
    const sqlite = new Database(':memory:');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    interface ExpoLikeApi {
        getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
        getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | undefined>;
        runAsync: (sql: string, params?: unknown[]) => Promise<unknown>;
        execAsync: (sql: string) => Promise<void>;
        withExclusiveTransactionAsync: (cb: (tx: unknown) => Promise<void>) => Promise<void>;
    }

    const expoLike: ExpoLikeApi = {
        getAllAsync: async <T>(sqlText: string, params: unknown[] = []) => sqlite.prepare(sqlText).all(...(params as never[])) as T[],
        getFirstAsync: async <T>(sqlText: string, params: unknown[] = []) =>
            sqlite.prepare(sqlText).get(...(params as never[])) as T | undefined,
        runAsync: async (sqlText: string, params: unknown[] = []) => sqlite.prepare(sqlText).run(...(params as never[])),
        execAsync: async (sqlText: string) => {
            sqlite.exec(sqlText);
        },
        withExclusiveTransactionAsync: async cb => {
            await cb(expoLike);
        }
    };

    Object.assign(sqlite, expoLike);

    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder });
    return db;
};
