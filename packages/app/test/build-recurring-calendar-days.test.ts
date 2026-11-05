import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { buildRecurringCalendarDays } from '../src/transaction/utils/build-recurring-calendar-days.util';

it.effect('keeps five Sunday-first weeks even for a four-week February', () =>
    Effect.sync(() => {
        const days = buildRecurringCalendarDays(2026, 1, undefined, new Date(2026, 1, 1));

        expect(days).toHaveLength(35);
        expect(days[0].date).toEqual(new Date(2026, 1, 1, 12));
        expect(days[34].date).toEqual(new Date(2026, 2, 7, 12));
        expect(days.filter(day => day.isCurrentMonth)).toHaveLength(28);
    })
);

it.effect('fills six weeks when the month crosses the fifth row', () =>
    Effect.sync(() => {
        const days = buildRecurringCalendarDays(2026, 4, undefined, new Date(2026, 4, 1));

        expect(days).toHaveLength(42);
        expect(days[0].date).toEqual(new Date(2026, 3, 26, 12));
        expect(days[41].date).toEqual(new Date(2026, 5, 6, 12));
        expect(days.filter(day => day.isCurrentMonth)).toHaveLength(31);
    })
);

it.effect('includes leap day and marks selected and today only on their full dates', () =>
    Effect.sync(() => {
        const days = buildRecurringCalendarDays(2024, 1, 29, new Date(2024, 1, 29, 23));

        expect(days.filter(day => day.isCurrentMonth)).toHaveLength(29);
        expect(days.filter(day => day.isSelected)).toEqual(days.filter(day => day.isToday));
        expect(days.find(day => day.isSelected)?.date).toEqual(new Date(2024, 1, 29, 12));
        expect(days.filter(day => !day.isCurrentMonth).every(day => day.isDisabled && !day.isSelected)).toBe(true);
        expect(days.filter(day => day.isCurrentMonth).every(day => !day.isDisabled)).toBe(true);
    })
);

it.effect('fills outside dates across both year boundaries without selecting duplicate day numbers', () =>
    Effect.sync(() => {
        const january = buildRecurringCalendarDays(2026, 0, 1, new Date(2025, 11, 28));
        const december = buildRecurringCalendarDays(2026, 11, 1, new Date(2027, 0, 1));

        expect(january[0]).toMatchObject({ date: new Date(2025, 11, 28, 12), isToday: true, isCurrentMonth: false, isDisabled: true });
        expect(december[34]).toMatchObject({ date: new Date(2027, 0, 2, 12), isCurrentMonth: false, isDisabled: true });
        expect(december.filter(day => day.isSelected)).toHaveLength(1);
        expect(december.find(day => day.isSelected)?.date).toEqual(new Date(2026, 11, 1, 12));
        expect(december.find(day => day.isToday)?.isSelected).toBe(false);
        expect(january.filter(day => day.isToday)).toHaveLength(1);
    })
);
