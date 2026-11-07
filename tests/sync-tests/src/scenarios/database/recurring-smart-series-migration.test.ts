import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer } from '../../harness';

const MIGRATION_SQL = readFileSync(
    resolve(process.cwd(), '../../packages/app/drizzle/20261105192451_recurring_smart_series/migration.sql'),
    'utf8'
);
const ADDED_COLUMNS = [
    'source',
    'account_id',
    'cadence_unit',
    'cadence_interval',
    'anchor_date',
    'instrument_id',
    'ends_at',
    'reminder_days_before',
    'confidence'
];
const LAST_SEEN_AT = 1_780_000_000;
const DEFAULT_INSTRUMENT_ID = 2;

interface CadenceScenario {
    readonly periodDays: number;
    readonly expected: string;
}

const cadenceScenarios: readonly CadenceScenario[] = [
    { periodDays: 7, expected: 'WEEK|1' },
    { periodDays: 14, expected: 'WEEK|2' },
    { periodDays: 28, expected: 'MONTH|1' },
    { periodDays: 31, expected: 'MONTH|1' },
    { periodDays: 61, expected: 'MONTH|2' },
    { periodDays: 91, expected: 'MONTH|3' },
    { periodDays: 183, expected: 'MONTH|6' },
    { periodDays: 365, expected: 'YEAR|1' },
    { periodDays: 100, expected: 'MONTH|3' },
    { periodDays: 10, expected: 'WEEK|1' },
    { periodDays: 500, expected: 'YEAR|1' }
];

const insertSeries = (periodDays: number, title: string) =>
    testDb.$client.unsafe(
        `INSERT INTO recurring_series (merchant_key, kind, period_days, amount, status, user_state, title, last_seen_at)
         VALUES ('${title}', 'EXPENSE', ${periodDays}, 12000, 'ACTIVE', 'SUGGESTED', '${title}', ${LAST_SEEN_AT})`
    ).raw;

const SYNC_TRIGGER_SUFFIXES = ['insert', 'update', 'delete'];

const preMigrationState = Effect.gen(function* () {
    yield* Effect.forEach(
        SYNC_TRIGGER_SUFFIXES,
        suffix => testDb.$client.unsafe(`DROP TRIGGER IF EXISTS recurring_series_sync_outbox_${suffix}`).raw,
        { discard: true }
    );
    yield* testDb.$client.unsafe('DROP TABLE recurring_series_transaction').raw;
    yield* Effect.forEach(ADDED_COLUMNS, column => testDb.$client.unsafe(`ALTER TABLE recurring_series DROP COLUMN ${column}`).raw, {
        discard: true
    });
});

const runMigration = Effect.forEach(MIGRATION_SQL.split('--> statement-breakpoint'), statement => testDb.$client.unsafe(statement).raw, {
    discard: true
});

describe('database/recurring-smart-series-migration', () => {
    it.effect('backfills cadence, anchor, instrument and confidence and keeps sinking fund links', () =>
        Effect.gen(function* () {
            yield* preMigrationState;
            yield* testDb.$client.unsafe(`UPDATE settings SET default_instrument_id = ${DEFAULT_INSTRUMENT_ID}`).raw;
            yield* testDb.$client.unsafe(
                `INSERT INTO settings (default_instrument_id) SELECT ${DEFAULT_INSTRUMENT_ID} WHERE NOT EXISTS (SELECT 1 FROM settings)`
            ).raw;
            yield* testDb.$client.unsafe(
                "INSERT INTO budgets (name, period, period_start_day, use_last_day_of_month, overall_limit, other_limit, instrument_id) VALUES ('Main', 'MONTHLY', 1, 0, 0, 0, 1)"
            ).raw;
            yield* Effect.forEach(cadenceScenarios, ({ periodDays }) => insertSeries(periodDays, `SERIES${periodDays}`), { discard: true });
            const seriesIds = yield* testDb.$client.unsafe<{ id: number; title: string }>(
                'SELECT id, title FROM recurring_series ORDER BY id'
            );
            const [firstSeries] = seriesIds;
            yield* testDb.$client.unsafe(
                `INSERT INTO budget_sinking_funds (budget_id, name, category_id, target_amount, due_at, recurring_series_id)
                 VALUES ((SELECT MIN(id) FROM budgets), 'Fund', (SELECT MIN(id) FROM categories), 1000, ${LAST_SEEN_AT}, ${firstSeries.id})`
            ).raw;
            const fundsBefore = yield* testDb.$client.unsafe<{ id: number; recurring_series_id: number }>(
                'SELECT id, recurring_series_id FROM budget_sinking_funds ORDER BY id'
            );

            yield* runMigration;

            const rows = yield* testDb.$client.unsafe<{
                title: string;
                cadence_unit: string;
                cadence_interval: number;
                anchor_date: number;
                instrument_id: number;
                confidence: number;
                source: string;
            }>(
                'SELECT title, cadence_unit, cadence_interval, anchor_date, instrument_id, confidence, source FROM recurring_series ORDER BY id'
            );
            const fundsAfter = yield* testDb.$client.unsafe<{ id: number; recurring_series_id: number }>(
                'SELECT id, recurring_series_id FROM budget_sinking_funds ORDER BY id'
            );

            expect(rows.map(row => `${row.cadence_unit}|${row.cadence_interval}`)).toEqual(
                cadenceScenarios.map(({ expected }) => expected)
            );
            expect(rows.every(row => row.anchor_date === LAST_SEEN_AT)).toBe(true);
            expect(rows.every(row => row.instrument_id === DEFAULT_INSTRUMENT_ID)).toBe(true);
            expect(rows.every(row => row.confidence === 60)).toBe(true);
            expect(rows.every(row => row.source === 'DETECTED')).toBe(true);
            expect(fundsAfter).toEqual(fundsBefore);
            expect(fundsAfter).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
