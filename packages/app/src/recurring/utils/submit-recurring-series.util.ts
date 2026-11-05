import { RecurringService } from '@budgie/recurring';
import { isSameDay } from 'date-fns/isSameDay';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { RecurringFormModeEnum } from '../enum/recurring-form-mode.enum';
import { RecurringRefreshModeEnum } from '../enum/recurring-refresh-mode.enum';

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

    const isScheduleChanged =
        !isSameDay(values.anchorDate, initialValues.anchorDate) ||
        values.repeat !== initialValues.repeat ||
        values.customInterval !== initialValues.customInterval ||
        values.customUnit !== initialValues.customUnit;
    const manualInput = { ...input, anchorDate, kind: values.kind };
    const save = () => {
        if (target.mode === RecurringFormModeEnum.EDIT) {
            return recurringService.update(target.seriesId, {
                ...input,
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
