import * as Effect from 'effect/Effect';

import type { DB } from '@budgie/contracts';

const SEEDED_TABLES = [
    'instruments',
    'mcc_groups',
    'mcc_categories',
    'categories',
    'settings',
    'default_category_translations',
    'historical_exchange_rates',
    'instrument_daily_market_prices',
    '__drizzle_migrations'
] as const;

const SEEDED_TABLE_LIST = SEEDED_TABLES.map(tableName => `'${tableName}'`).join(', ');

export const resetTestDb = (database: DB) =>
    Effect.gen(function* () {
        const client = database.$client;
        const tables = yield* client.unsafe<{ readonly name: string }>(
            `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT IN (${SEEDED_TABLE_LIST})`
        );

        yield* client.unsafe('PRAGMA foreign_keys = OFF');
        yield* Effect.forEach(tables, ({ name }) => client.unsafe(`DELETE FROM "${name}"`), { discard: true });
        yield* client.unsafe(`DELETE FROM sqlite_sequence WHERE name NOT IN (${SEEDED_TABLE_LIST})`);
        yield* client.unsafe('PRAGMA foreign_keys = ON');
    });
