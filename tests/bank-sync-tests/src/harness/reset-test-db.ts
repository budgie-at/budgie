import { sql } from 'drizzle-orm';

import * as schema from '@app/@generic/drizzle/db/schema';

import { testDb } from './setup';

const REFERENCE_TABLES = new Set(['instruments', 'mcc_groups', 'mcc_categories', 'categories', 'settings']);

const collectTableNames = (): string[] => {
    const result: string[] = [];
    for (const value of Object.values(schema)) {
        if (value !== null && typeof value === 'object') {
            for (const symbol of Object.getOwnPropertySymbols(value)) {
                if (symbol.toString().includes('Symbol(drizzle:Name)')) {
                    const indexed = value as unknown as Record<symbol, unknown>;
                    const name = indexed[symbol];
                    if (typeof name === 'string') {
                        result.push(name);
                    }
                }
            }
        }
    }
    return [...new Set(result)];
};

const MUTABLE_TABLES = collectTableNames().filter(name => !REFERENCE_TABLES.has(name));

export const resetTestDb = (): void => {
    testDb.run(sql`PRAGMA foreign_keys = OFF`);
    for (const table of MUTABLE_TABLES) {
        testDb.run(sql.raw(`DELETE FROM "${table}"`));
    }
    testDb.run(
        sql`DELETE FROM sqlite_sequence WHERE name NOT IN ('instruments', 'mcc_groups', 'mcc_categories', 'categories', 'settings')`
    );
    testDb.run(sql`PRAGMA foreign_keys = ON`);
};
