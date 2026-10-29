import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { RecurringSeriesEntityTable, RecurringSeriesUserStateEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb, TestLayer } from '../../harness';

const MIGRATION_SQL = readFileSync(
    resolve(process.cwd(), '../../packages/app/drizzle/20261029131908_dedupe_recurring_series/migration.sql'),
    'utf8'
);
const CREATED_AT = 1_780_000_000;
const { SUGGESTED } = RecurringSeriesUserStateEnum;

interface SeedRow {
    readonly amount?: number;
    readonly lastSeenAt?: number;
    readonly periodDays?: number;
    readonly title?: string;
    readonly userState?: RecurringSeriesUserStateEnum;
    readonly isUpdated?: boolean;
}

const insertSeries = ({
    amount = 12_000,
    lastSeenAt = CREATED_AT,
    periodDays = 30,
    title = 'NETFLIX',
    userState = SUGGESTED,
    isUpdated = false
}: SeedRow) =>
    testDb.$client.unsafe(
        `INSERT INTO recurring_series (merchant_key, kind, period_days, amount, status, user_state, title, last_seen_at, created_at, updated_at)
         VALUES ('NETFLIX', 'EXPENSE', ${periodDays}, ${amount}, 'ACTIVE', '${userState}', '${title}', ${lastSeenAt}, ${CREATED_AT}, ${CREATED_AT + Number(isUpdated)})`
    ).raw;

const survivingTitles = () =>
    Effect.map(testDb.select().from(RecurringSeriesEntityTable).where(isNull(RecurringSeriesEntityTable.deletedAt)), rows =>
        rows.map(row => `${row.periodDays}|${row.amount}|${row.userState}|${row.title}`)
    );

interface Scenario {
    readonly name: string;
    readonly seeded: readonly SeedRow[];
    readonly expected: readonly string[];
}

const scenarios: readonly Scenario[] = [
    {
        name: 'collapses 240 untouched duplicates to the lowest id',
        seeded: Array.from({ length: 240 }, () => ({})),
        expected: ['30|12000|SUGGESTED|NETFLIX']
    },
    {
        name: 'keeps a confirmed and a dismissed duplicate',
        seeded: [{ userState: RecurringSeriesUserStateEnum.CONFIRMED }, { userState: RecurringSeriesUserStateEnum.DISMISSED }],
        expected: ['30|12000|CONFIRMED|NETFLIX', '30|12000|DISMISSED|NETFLIX']
    },
    {
        name: 'keeps a renamed row and drops its untouched duplicates',
        seeded: [{}, { title: 'Streaming', isUpdated: true }, {}],
        expected: ['30|12000|SUGGESTED|NETFLIX', '30|12000|SUGGESTED|Streaming']
    },
    {
        name: 'keeps a row renamed within its creation second',
        seeded: [{}, { title: 'Streaming' }],
        expected: ['30|12000|SUGGESTED|NETFLIX', '30|12000|SUGGESTED|Streaming']
    },
    {
        name: 'drops untouched duplicates of a confirmed row',
        seeded: [{}, { userState: RecurringSeriesUserStateEnum.CONFIRMED, isUpdated: true }, {}],
        expected: ['30|12000|CONFIRMED|NETFLIX']
    },
    {
        name: 'drops untouched duplicates whose amount or last charge drifted',
        seeded: [
            {},
            { amount: 15_000, lastSeenAt: CREATED_AT + 2_592_000 },
            { userState: RecurringSeriesUserStateEnum.DISMISSED, isUpdated: true }
        ],
        expected: ['30|12000|DISMISSED|NETFLIX']
    },
    {
        name: 'keeps rows with a different period',
        seeded: [{}, { periodDays: 365 }],
        expected: ['30|12000|SUGGESTED|NETFLIX', '365|12000|SUGGESTED|NETFLIX']
    }
];

describe('database/dedupe-recurring-series-migration', () => {
    it.effect.each(scenarios)('$name', ({ seeded, expected }) =>
        Effect.gen(function* () {
            yield* Effect.forEach(seeded, insertSeries, { discard: true });
            yield* testDb.$client.unsafe(MIGRATION_SQL).raw;
            const afterFirstRun = yield* survivingTitles();
            yield* testDb.$client.unsafe(MIGRATION_SQL).raw;

            expect(afterFirstRun.toSorted()).toEqual([...expected].toSorted());
            expect(yield* survivingTitles()).toEqual(afterFirstRun);
        }).pipe(Effect.provide(TestLayer))
    );
});
