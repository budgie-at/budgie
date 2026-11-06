import { convertFromMicroUnits } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { RECURRING_REPEAT_CADENCE } from '../constant/recurring-repeat-cadence.constant';
import { RecurringEndModeEnum } from '../enum/recurring-end-mode.enum';
import { RecurringRepeatChoiceEnum } from '../enum/recurring-repeat-choice.enum';

import { buildDefaultRecurringFormValues } from './build-default-recurring-form-values.util';
import { getRecurringReminderChoice } from './get-recurring-reminder-choice.util';

import type { RecurringSeriesFormValues } from '../constant/recurring-series-form-schema.constant';
import type { RecurringSeriesDetailInterface } from '@budgie/recurring';

const PRESET_CHOICES = [
    RecurringRepeatChoiceEnum.WEEKLY,
    RecurringRepeatChoiceEnum.BIWEEKLY,
    RecurringRepeatChoiceEnum.MONTHLY,
    RecurringRepeatChoiceEnum.YEARLY
] as const;

export const buildRecurringFormValuesFromSeries = (
    detail: RecurringSeriesDetailInterface,
    defaultInstrumentId: number,
    today: Date
): RecurringSeriesFormValues => {
    const { series, nextDates } = detail;
    const anchorDate = nextDates.at(0) ?? series.endsAt ?? today;
    const defaults = buildDefaultRecurringFormValues(series.instrumentId ?? defaultInstrumentId, anchorDate);
    const presetChoice = PRESET_CHOICES.find(
        choice =>
            RECURRING_REPEAT_CADENCE[choice].cadenceUnit === series.cadenceUnit &&
            RECURRING_REPEAT_CADENCE[choice].cadenceInterval === series.cadenceInterval
    );

    return {
        ...defaults,
        kind: series.kind,
        title: series.title,
        amount: convertFromMicroUnits(series.nativeAmount),
        categoryId: series.categoryId,
        accountId: series.accountId,
        repeat: presetChoice ?? RecurringRepeatChoiceEnum.CUSTOM,
        customInterval: series.cadenceInterval,
        customUnit: series.cadenceUnit,
        endMode: isDefined(series.endsAt) ? RecurringEndModeEnum.ON_DATE : RecurringEndModeEnum.NEVER,
        endsOn: series.endsAt ?? defaults.endsOn,
        reminder: getRecurringReminderChoice(series.reminderDaysBefore)
    };
};
