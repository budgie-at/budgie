import { convertToMicroUnits } from '@budgie/contracts';

import { RECURRING_REMINDER_DAYS } from '../constant/recurring-reminder-days.constant';

import { resolveRecurringSchedule } from './resolve-recurring-schedule.util';

import type { RecurringSeriesFormValues } from '../constant/recurring-series-form-schema.constant';

export const buildRecurringSeriesInput = (values: RecurringSeriesFormValues) => ({
    ...resolveRecurringSchedule(values),
    title: values.title,
    amount: convertToMicroUnits(values.amount),
    instrumentId: values.instrumentId,
    categoryId: values.categoryId,
    accountId: values.accountId,
    reminderDaysBefore: RECURRING_REMINDER_DAYS[values.reminder]
});
