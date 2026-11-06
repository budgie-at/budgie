import { convertToMicroUnits, RecurringSeriesSourceEnum } from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { isSameDay } from 'date-fns/isSameDay';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { RECURRING_REMINDER_DAYS } from '../constant/recurring-reminder-days.constant';
import { RecurringFormModeEnum } from '../enum/recurring-form-mode.enum';
import { RecurringRefreshModeEnum } from '../enum/recurring-refresh-mode.enum';

import { resolveRecurringSchedule } from './resolve-recurring-schedule.util';
import { scheduleRecurringRefresh } from './schedule-recurring-refresh.util';

import type { RecurringSeriesFormValues } from '../constant/recurring-series-form-schema.constant';
import type { RecurringSeriesFormTargetType } from '../type/recurring-series-form-target.type';

export const submitRecurringSeries = Effect.fn('submitRecurringSeries')(function* (
    target: RecurringSeriesFormTargetType,
    values: RecurringSeriesFormValues,
    initialValues: RecurringSeriesFormValues
) {
    const recurringService = yield* RecurringService;
    const schedule = resolveRecurringSchedule(values);
    const initialSchedule = resolveRecurringSchedule(initialValues);
    const isScheduleChanged =
        !isSameDay(values.anchorDate, initialValues.anchorDate) ||
        schedule.cadenceUnit !== initialSchedule.cadenceUnit ||
        schedule.cadenceInterval !== initialSchedule.cadenceInterval;
    const { anchorDate, ...resolvedSchedule } =
        target.mode === RecurringFormModeEnum.EDIT && !isScheduleChanged
            ? resolveRecurringSchedule({ ...values, anchorDate: target.anchorDate }, values.anchorDate)
            : schedule;
    const input = {
        ...resolvedSchedule,
        title: values.title,
        categoryId: values.categoryId,
        accountId: values.accountId,
        reminderDaysBefore: RECURRING_REMINDER_DAYS[values.reminder]
    };
    const price = { amount: convertToMicroUnits(values.amount), instrumentId: values.instrumentId };
    const manualInput = { ...input, ...price, anchorDate, kind: values.kind };
    const save = () => {
        if (target.mode === RecurringFormModeEnum.EDIT) {
            return recurringService.update(target.seriesId, {
                ...input,
                ...(target.source === RecurringSeriesSourceEnum.MANUAL && price),
                ...(isScheduleChanged && { anchorDate })
            });
        }

        return isDefined(target.transactionId)
            ? recurringService.makeRecurringFromTransaction(target.transactionId, manualInput)
            : recurringService.createManual(manualInput);
    };
    const series = yield* save();

    yield* scheduleRecurringRefresh(RecurringRefreshModeEnum.RECENT);

    return series.id;
});
