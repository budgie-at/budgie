import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as schema from '@app/@generic/drizzle/db/schema';
import Database from 'better-sqlite3';
import { drizzle as drizzleBetterSqlite } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle as drizzleExpoSqlite } from 'drizzle-orm/expo-sqlite';
import { SQLiteDatabase, SQLiteStatement } from 'expo-sqlite';

import { emptyFn, isArray, isDefined } from '@rnw-community/shared';

import { TestDatabaseFile } from './test-database-file';

import type { ExpoLikeApiInterface } from './expo-like-api.interface';
import type { ExpoSqliteExecuteSyncResultInterface } from './interface/expo-sqlite-execute-sync-result.interface';
import type { DB } from '@budgie/contracts';

const here = resolve(fileURLToPath(import.meta.url), '..');
const migrationsFolder = resolve(here, '../../../../packages/app/drizzle');

type ExpoSqliteDatabase = Parameters<typeof drizzleExpoSqlite>[0];
type ExpoSqliteStatement = ReturnType<ExpoSqliteDatabase['prepareSync']>;

const normalizeSqliteParams = (params: readonly unknown[]): unknown[] => {
    const [firstParam] = params;

    if (params.length === 1 && isArray(firstParam)) {
        return [...firstParam];
    }

    return [...params];
};

const buildExecuteSyncResult = <T>(
    sqlite: Database.Database,
    sqlText: string,
    params: readonly unknown[],
    raw: boolean
): ExpoSqliteExecuteSyncResultInterface<T> => {
    const normalizedParams = normalizeSqliteParams(params);
    let runResult: Database.RunResult | null = null;
    let iterator: IterableIterator<T> | null = null;

    const getRunResult = (): Database.RunResult => {
        if (!isDefined(runResult)) {
            runResult = sqlite.prepare(sqlText).run(...normalizedParams);
        }

        return runResult;
    };

    const getIteratorResult = (): IterableIterator<T> => {
        if (!isDefined(iterator)) {
            iterator = sqlite.prepare<unknown[], T>(sqlText).iterate(...normalizedParams);
        }

        return iterator;
    };

    const result: ExpoSqliteExecuteSyncResultInterface<T> = {
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
        [Symbol.iterator]() {
            return this;
        }
    };

    return result;
};

const buildSqliteStatement = (sqlite: Database.Database, sqlText: string): ExpoSqliteStatement => {
    const candidate: unknown = Object.assign(Object.create(SQLiteStatement.prototype), {
        executeSync: <T>(...params: readonly unknown[]) => buildExecuteSyncResult<T>(sqlite, sqlText, params, false),
        executeForRawResultSync: <T extends object>(...params: readonly unknown[]) =>
            buildExecuteSyncResult<T[keyof T][]>(sqlite, sqlText, params, true),
        finalizeSync: emptyFn,
        getColumnNamesSync: () =>
            sqlite
                .prepare(sqlText)
                .columns()
                .map(column => column.name),
        nativeDatabase: sqlite,
        nativeStatement: sqlite.prepare(sqlText)
    });

    if (!(candidate instanceof SQLiteStatement)) {
        throw new Error('Test SQLite statement adapter was not initialized');
    }

    return candidate;
};

const buildExpoSqliteDatabase = (sqlite: Database.Database & ExpoLikeApiInterface): ExpoSqliteDatabase => {
    const candidate: unknown = Object.assign(Object.create(SQLiteDatabase.prototype), {
        ...sqlite,
        $client: sqlite,
        databasePath: sqlite.name,
        nativeDatabase: sqlite,
        options: {},
        prepareSync: (sqlText: string) => buildSqliteStatement(sqlite, sqlText)
    });

    if (!(candidate instanceof SQLiteDatabase)) {
        throw new Error('Test SQLite database adapter was not initialized');
    }

    return candidate;
};

export const buildTestDb = (sourceDatabasePath: string | null = null): DB => {
    const databaseFile = new TestDatabaseFile(sourceDatabasePath);
    try {
        const sqlite = databaseFile.open();
        let expoSqlite: ExpoSqliteDatabase | null = null;

        const expoLike: ExpoLikeApiInterface = {
            getAllAsync: async <T>(sqlText: string, params: unknown[] = []) => sqlite.prepare<unknown[], T>(sqlText).all(...params),
            getFirstAsync: async <T>(sqlText: string, params: unknown[] = []) =>
                sqlite.prepare<unknown[], T>(sqlText).get(...params) ?? null,
            runAsync: async (sqlText: string, params: unknown[] = []) => sqlite.prepare(sqlText).run(...params),
            execAsync: async (sqlText: string) => {
                sqlite.exec(sqlText);
            },
            closeAsync: async () => {
                databaseFile.close();
            },
            withExclusiveTransactionAsync: async callback => {
                if (!isDefined(expoSqlite)) {
                    throw new Error('Test database was not initialized');
                }

                await callback(expoSqlite);
            }
        };

        const testSqlite = Object.assign(sqlite, expoLike);
        expoSqlite = buildExpoSqliteDatabase(testSqlite);
        migrate(drizzleBetterSqlite(sqlite, { schema }), { migrationsFolder });

        return drizzleExpoSqlite(expoSqlite, { schema });
    } catch (error) {
        databaseFile.close();
        throw error;
    }
};
