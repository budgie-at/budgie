import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { selectRecurringReminderPlans } from '../src/recurring/utils/select-recurring-reminder-plans.util';

const at = (year: number, month: number, day: number, hours = 8): Date => new Date(year, month, day, hours);

it.effect('schedules the next unpaid cycle at nine on the reminder day', () =>
    Effect.sync(() => {
        const plans = selectRecurringReminderPlans(
            [{ id: 7, nextDate: new Date(2026, 10, 10), reminderDaysBefore: 1 }],
            new Date(2026, 10, 1)
        );

        expect(plans).toEqual([{ seriesId: 7, scheduledAt: new Date(2026, 10, 9, 9), daysUntilDue: 1 }]);
    })
);

it.effect('marks a same day reminder as due today', () =>
    Effect.sync(() => {
        const plans = selectRecurringReminderPlans(
            [{ id: 3, nextDate: new Date(2026, 10, 10), reminderDaysBefore: 0 }],
            new Date(2026, 10, 10)
        );

        expect(plans).toEqual([{ seriesId: 3, scheduledAt: new Date(2026, 10, 10, 9), daysUntilDue: 0 }]);
    })
);

it.effect('keeps occurrences inside the sixty day window only', () =>
    Effect.sync(() => {
        const now = at(2026, 10, 1);
        const plans = selectRecurringReminderPlans(
            [
                { id: 1, nextDate: new Date(2026, 11, 31), reminderDaysBefore: 1 },
                { id: 2, nextDate: new Date(2027, 0, 1), reminderDaysBefore: 1 }
            ],
            now
        );

        expect(plans.map(plan => plan.seriesId)).toEqual([1]);
    })
);

it.effect('skips reminder times that already passed', () =>
    Effect.sync(() => {
        const plans = selectRecurringReminderPlans(
            [
                { id: 1, nextDate: new Date(2026, 10, 10), reminderDaysBefore: 3 },
                { id: 2, nextDate: new Date(2026, 10, 20), reminderDaysBefore: 3 }
            ],
            new Date(2026, 10, 9, 12)
        );

        expect(plans).toEqual([{ seriesId: 2, scheduledAt: new Date(2026, 10, 17, 9), daysUntilDue: 3 }]);
    })
);

it.effect('keeps the fifty soonest reminders', () =>
    Effect.sync(() => {
        const series = Array.from({ length: 60 }, (_, index) => ({
            id: index + 1,
            nextDate: new Date(2026, 10, 2 + index),
            reminderDaysBefore: 1
        }));
        const plans = selectRecurringReminderPlans(series, at(2026, 10, 1));

        expect(plans).toHaveLength(50);
        expect(plans[0].seriesId).toBe(1);
        expect(plans[49].seriesId).toBe(50);
        expect(plans.every((plan, index) => index === 0 || plan.scheduledAt.getTime() > plans[index - 1].scheduledAt.getTime())).toBe(true);
    })
);

it.effect('ignores series without a reminder or an unpaid cycle', () =>
    Effect.sync(() => {
        const plans = selectRecurringReminderPlans(
            [
                { id: 1, nextDate: new Date(2026, 10, 10), reminderDaysBefore: null },
                { id: 2, nextDate: null, reminderDaysBefore: 1 }
            ],
            at(2026, 10, 1)
        );

        expect(plans).toEqual([]);
    })
);
