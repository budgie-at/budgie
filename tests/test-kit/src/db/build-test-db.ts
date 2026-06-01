import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isDefined } from '@rnw-community/shared';

import * as schema from './schema';
import type { ExpoLikeApiInterface } from './expo-like-api.interface';

const here = resolve(fileURLToPath(import.meta.url), '..');
const migrationsFolder = resolve(here, '../../../../packages/app/drizzle');

type TestDb = BetterSQLite3Database<typeof schema>;

export const buildTestDb = (): TestDb => {
    const sqlite = new Database(':memory:');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    const expoLike: ExpoLikeApiInterface = {
        getAllAsync: async <T>(sqlText: string, params: unknown[] = []) => sqlite.prepare<unknown[], T>(sqlText).all(...params),
        getFirstAsync: async <T>(sqlText: string, params: unknown[] = []) => {
            const result = sqlite.prepare<unknown[], T>(sqlText).get(...params);

            if (isDefined(result)) {
                return result;
            }

            return undefined;
        },
        runAsync: async (sqlText: string, params: unknown[] = []) => sqlite.prepare<unknown[]>(sqlText).run(...params),
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
