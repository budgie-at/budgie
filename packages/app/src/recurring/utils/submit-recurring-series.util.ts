import { RecurringService } from '@budgie/recurring';
import { isSameDay } from 'date-fns/isSameDay';
import * as Effect from 'effect/Effect';
import * as Notifications from 'expo-notifications';

import { RecurringFormModeEnum } from '../enum/recurring-form-mode.enum';
import { RecurringRefreshModeEnum } from '../enum/recurring-refresh-mode.enum';
import { RecurringReminderChoiceEnum } from '../enum/recurring-reminder-choice.enum';

import { buildRecurringSeriesInput } from './build-recurring-series-input.util';
import { scheduleRecurringRefresh } from './schedule-recurring-refresh.util';

import type { RecurringSeriesFormValues } from '../constant/recurring-series-form-schema.constant';
import type { RecurringSeriesFormTargetType } from '../type/recurring-series-form-target.type';

export const submitRecurringSeries = Effect.fn('submitRecurringSeries')(function* (
    target: RecurringSeriesFormTargetType,
    values: RecurringSeriesFormValues,
    initialValues: RecurringSeriesFormValues
) {
    const recurringService = yield* RecurringService;
    const { anchorDate, ...input } = buildRecurringSeriesInput(values);

    if (values.reminder !== RecurringReminderChoiceEnum.OFF) {
        yield* Effect.promise(() => Notifications.requestPermissionsAsync());
    }

    const series =
        target.mode === RecurringFormModeEnum.EDIT
            ? yield* recurringService.update(target.seriesId, {
                  ...input,
                  ...(!isSameDay(values.anchorDate, initialValues.anchorDate) && { anchorDate })
              })
            : yield* recurringService.createManual({ ...input, anchorDate, kind: values.kind });

    yield* scheduleRecurringRefresh(RecurringRefreshModeEnum.RECENT);

    return series.id;
});
