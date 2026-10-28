import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { computeClosedPeriods } from '../src/history/utils/budget-closed-periods.util';

const CALENDAR_MONTH = { periodStartDay: 1, useLastDayOfMonth: false };
const LAST_DAY_OF_MONTH = { periodStartDay: 1, useLastDayOfMonth: true };

it.effect('backfills the last six closed periods when no snapshot exists', () =>
    Effect.sync(() => {
        const windows = computeClosedPeriods(CALENDAR_MONTH, new Date(2026, 2, 15), null, new Date(2025, 0, 1));

        expect(windows).toHaveLength(6);
        expect(windows[0]?.periodStart).toEqual(new Date(2025, 8, 1));
        expect(windows[5]?.periodStart).toEqual(new Date(2026, 1, 1));
        expect(windows[5]?.nextPeriodStart).toEqual(new Date(2026, 2, 1));
    })
);

it.effect('does not backfill periods that end before the first transaction', () =>
    Effect.sync(() => {
        const windows = computeClosedPeriods(CALENDAR_MONTH, new Date(2026, 2, 15), null, new Date(2026, 0, 20));

        expect(windows.map(window => window.periodStart)).toEqual([new Date(2026, 0, 1), new Date(2026, 1, 1)]);
    })
);

it.effect('returns nothing without snapshots and without transactions', () =>
    Effect.sync(() => {
        expect(computeClosedPeriods(CALENDAR_MONTH, new Date(2026, 2, 15), null, null)).toEqual([]);
    })
);

it.effect('returns only periods closed after the latest snapshot', () =>
    Effect.sync(() => {
        const windows = computeClosedPeriods(CALENDAR_MONTH, new Date(2026, 3, 15), new Date(2026, 0, 1), new Date(2025, 0, 1));

        expect(windows.map(window => window.periodStart)).toEqual([new Date(2026, 1, 1), new Date(2026, 2, 1)]);
    })
);

it.effect('returns no duplicates once the latest closed period is snapshotted', () =>
    Effect.sync(() => {
        const windows = computeClosedPeriods(CALENDAR_MONTH, new Date(2026, 2, 15), new Date(2026, 1, 1), new Date(2025, 0, 1));

        expect(windows).toEqual([]);
    })
);

it.effect('treats the exact period boundary as the start of the next period', () =>
    Effect.sync(() => {
        const windows = computeClosedPeriods(CALENDAR_MONTH, new Date(2026, 2, 1), new Date(2025, 11, 1), new Date(2025, 0, 1));

        expect(windows.map(window => window.periodStart)).toEqual([new Date(2026, 0, 1), new Date(2026, 1, 1)]);
    })
);

it.effect('clamps a start day beyond the month length', () =>
    Effect.sync(() => {
        const windows = computeClosedPeriods(
            { periodStartDay: 31, useLastDayOfMonth: false },
            new Date(2026, 2, 15),
            null,
            new Date(2025, 11, 1)
        );
        const last = windows[windows.length - 1];

        expect(last?.periodStart).toEqual(new Date(2026, 0, 31));
        expect(last?.nextPeriodStart).toEqual(new Date(2026, 1, 28));
    })
);

it.effect('enumerates last-day-of-month periods across February', () =>
    Effect.sync(() => {
        const windows = computeClosedPeriods(LAST_DAY_OF_MONTH, new Date(2026, 2, 15), null, new Date(2025, 10, 1));

        expect(windows.map(window => window.periodStart)).toEqual([
            new Date(2025, 9, 31),
            new Date(2025, 10, 30),
            new Date(2025, 11, 31),
            new Date(2026, 0, 31)
        ]);
        expect(windows[3]?.nextPeriodStart).toEqual(new Date(2026, 1, 28));
    })
);

it.effect('produces contiguous windows for a custom start day', () =>
    Effect.sync(() => {
        const windows = computeClosedPeriods(
            { periodStartDay: 15, useLastDayOfMonth: false },
            new Date(2026, 5, 20),
            null,
            new Date(2025, 0, 1)
        );

        expect(windows).toHaveLength(6);
        expect(windows.slice(1).every((window, index) => window.periodStart.getTime() === windows[index]?.nextPeriodStart.getTime())).toBe(
            true
        );
        expect(windows[5]?.nextPeriodStart).toEqual(new Date(2026, 5, 15));
    })
);

it.effect('caps catch-up after a long absence', () =>
    Effect.sync(() => {
        const windows = computeClosedPeriods(CALENDAR_MONTH, new Date(2026, 2, 15), new Date(2023, 0, 1), new Date(2022, 0, 1));

        expect(windows).toHaveLength(12);
        expect(windows[11]?.nextPeriodStart).toEqual(new Date(2026, 2, 1));
    })
);
