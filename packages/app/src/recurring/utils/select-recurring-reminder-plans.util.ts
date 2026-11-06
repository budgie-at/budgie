import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { setHours } from 'date-fns/setHours';
import { startOfDay } from 'date-fns/startOfDay';
import { subDays } from 'date-fns/subDays';

import { isDefined } from '@rnw-community/shared';

import type { RecurringReminderPlanInterface } from '../interface/recurring-reminder-plan.interface';
import type { RecurringReminderSeriesInterface } from '../interface/recurring-reminder-series.interface';

const REMINDER_HOUR = 9;
const REMINDER_WINDOW_DAYS = 60;
const REMINDER_LIMIT = 50;

const toPlan = (series: RecurringReminderSeriesInterface, now: Date): RecurringReminderPlanInterface | null => {
    if (!isDefined(series.reminderDaysBefore) || !isDefined(series.nextDate)) {
        return null;
    }
    if (differenceInCalendarDays(series.nextDate, now) > REMINDER_WINDOW_DAYS) {
        return null;
    }
    const scheduledAt = setHours(subDays(startOfDay(series.nextDate), series.reminderDaysBefore), REMINDER_HOUR);

    if (scheduledAt.getTime() <= now.getTime()) {
        return null;
    }

    return { seriesId: series.id, scheduledAt, daysUntilDue: differenceInCalendarDays(series.nextDate, scheduledAt) };
};

export const selectRecurringReminderPlans = (
    series: readonly RecurringReminderSeriesInterface[],
    now: Date
): RecurringReminderPlanInterface[] =>
    series
        .map(item => toPlan(item, now))
        .filter(isDefined)
        .sort((first, second) => first.scheduledAt.getTime() - second.scheduledAt.getTime())
        .slice(0, REMINDER_LIMIT);
