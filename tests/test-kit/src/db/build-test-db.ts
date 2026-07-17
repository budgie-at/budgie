import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as schema from '@app/@generic/drizzle/db/schema';
import Database from 'better-sqlite3';
import { drizzle as drizzleBetterSqlite } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle as drizzleExpoSqlite } from 'drizzle-orm/expo-sqlite';

import { emptyFn, isDefined } from '@rnw-community/shared';

import type { ExpoLikeApiInterface } from './expo-like-api.interface';
import type { DB } from '@budgie/contracts';

const here = resolve(fileURLToPath(import.meta.url), '..');
const migrationsFolder = resolve(here, '../../../../packages/app/drizzle');

type ExpoSqliteDatabase = Parameters<typeof drizzleExpoSqlite>[0];
type ExpoSqliteStatement = ReturnType<ExpoSqliteDatabase['prepareSync']>;
type ExpoSqliteExecuteSyncResult<T> = IterableIterator<T> & {
    readonly changes: number;
    readonly lastInsertRowId: number;
    readonly getFirstSync: () => T | null;
    readonly getAllSync: () => T[];
    readonly resetSync: () => void;
};

const normalizeSqliteParams = (params: readonly unknown[]): unknown[] => {
    const firstParam = params[0];

    if (params.length === 1 && Array.isArray(firstParam)) {
        return [...firstParam];
    }

    return [...params];
};

const buildExecuteSyncResult = <T>(
    sqlite: Database.Database,
    sqlText: string,
    params: readonly unknown[],
    raw: boolean
): ExpoSqliteExecuteSyncResult<T> => {
    const normalizedParams = normalizeSqliteParams(params);
    let runResult: Database.RunResult | null = null;
    let iterator: IterableIterator<T> | null = null;

    const getRunResult = (): Database.RunResult => {
        if (!isDefined(runResult)) {
            runResult = sqlite.prepare<unknown[]>(sqlText).run(...normalizedParams);
        }

        return runResult;
    };

    const getIteratorResult = (): IterableIterator<T> => {
        if (!isDefined(iterator)) {
            iterator = sqlite.prepare<unknown[], T>(sqlText).iterate(...normalizedParams);
        }

        return iterator;
    };

    const getIterator = (): ExpoSqliteExecuteSyncResult<T> => result;

    const result: ExpoSqliteExecuteSyncResult<T> = {
        get changes() {
            return getRunResult().changes;
        },
        get lastInsertRowId() {
            return Number(getRunResult().lastInsertRowid);
        },
        getFirstSync: () => sqlite.prepare<unknown[], T>(sqlText).get(...normalizedParams) ?? null,
        getAllSync: () =>
            sqlite
                .prepare<unknown[], T>(sqlText)
                .raw(raw)
                .all(...normalizedParams),
        resetSync: emptyFn,
        next: () => getIteratorResult().next(),
        [Symbol.iterator]: getIterator
    };

    return result;
};

const buildSqliteStatement = (sqlite: Database.Database, sqlText: string): ExpoSqliteStatement =>
    Object.assign(Object.create(null), {
        executeSync: <T>(...params: readonly unknown[]) => buildExecuteSyncResult<T>(sqlite, sqlText, params, false),
        executeForRawResultSync: <T extends object>(...params: readonly unknown[]) =>
            buildExecuteSyncResult<T[keyof T][]>(sqlite, sqlText, params, true),
        finalizeSync: emptyFn,
        getColumnNamesSync: () =>
            sqlite
                .prepare(sqlText)
                .columns()
                .map(column => column.name)
    });

const buildExpoSqliteDatabase = (sqlite: Database.Database & ExpoLikeApiInterface): ExpoSqliteDatabase =>
    Object.assign(Object.create(null), {
        ...sqlite,
        $client: sqlite,
        prepareSync: (sqlText: string) => buildSqliteStatement(sqlite, sqlText)
    });

export const buildTestDb = (): DB => {
    const sqlite = new Database(':memory:');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    let expoSqlite: ExpoSqliteDatabase | null = null;

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
            if (!isDefined(expoSqlite)) {
                throw new Error('Test database was not initialized');
            }

            await cb(expoSqlite);
        }
    };

    const testSqlite = Object.assign(sqlite, expoLike);
    expoSqlite = buildExpoSqliteDatabase(testSqlite);
    const migrationDb = drizzleBetterSqlite(sqlite, { schema });
    const db: DB = drizzleExpoSqlite(expoSqlite, { schema });

    migrate(migrationDb, { migrationsFolder });
    return db;
};
