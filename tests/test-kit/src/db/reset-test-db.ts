import * as Effect from 'effect/Effect';

import type { DB } from '@budgie/contracts';

type Client = DB['$client'];

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

export const snapshotTestDb = (client: Client) =>
    Effect.gen(function* () {
        yield* client.unsafe(`ATTACH ':memory:' AS baseline`);
        yield* client.unsafe('CREATE TABLE baseline.sequence AS SELECT * FROM main.sqlite_sequence');
        yield* client.unsafe('CREATE TABLE baseline.stat1 AS SELECT * FROM main.sqlite_stat1');
        yield* Effect.forEach(SEEDED_TABLES, name => client.unsafe(`CREATE TABLE baseline."${name}" AS SELECT * FROM main."${name}"`), {
            discard: true
        });
    });

export const resetTestDb = (database: DB) =>
    Effect.gen(function* () {
        const client = database.$client;
        const tables = yield* client.unsafe<{ readonly name: string }>(
            `SELECT name FROM main.sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
        );

        yield* client.unsafe('PRAGMA foreign_keys = OFF');
        yield* Effect.forEach(tables, ({ name }) => client.unsafe(`DELETE FROM main."${name}"`), { discard: true });
        yield* Effect.forEach(
            SEEDED_TABLES,
            name =>
                client
                    .unsafe<{ readonly columns: string }>(
                        `SELECT group_concat('"' || name || '"') AS columns FROM pragma_table_info('${name}', 'baseline')`
                    )
                    .pipe(
                        Effect.flatMap(([{ columns }]) =>
                            client.unsafe(`INSERT INTO main."${name}" (${columns}) SELECT ${columns} FROM baseline."${name}"`)
                        )
                    ),
            { discard: true }
        );
        yield* client.unsafe('DELETE FROM main.sqlite_sequence');
        yield* client.unsafe('INSERT INTO main.sqlite_sequence SELECT * FROM baseline.sequence');
        yield* client.unsafe('DELETE FROM main.sync_outbox');
        yield* client.unsafe('DELETE FROM main.sqlite_stat1');
        yield* client.unsafe('INSERT INTO main.sqlite_stat1 SELECT * FROM baseline.stat1');
        yield* client.unsafe('ANALYZE sqlite_schema');
        yield* client.unsafe('PRAGMA foreign_keys = ON');
    });
