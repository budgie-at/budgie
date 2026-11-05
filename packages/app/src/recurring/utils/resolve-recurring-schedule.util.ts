import { nextOccurrences } from '@budgie/recurring';
import { startOfDay } from 'date-fns/startOfDay';

import { RECURRING_REPEAT_CADENCE } from '../constant/recurring-repeat-cadence.constant';
import { RecurringEndModeEnum } from '../enum/recurring-end-mode.enum';
import { RecurringRepeatChoiceEnum } from '../enum/recurring-repeat-choice.enum';

import type { RecurringSeriesFormValues } from '../constant/recurring-series-form-schema.constant';
import type { RecurringSeriesEntityInterface } from '@budgie/contracts';

type ScheduleFormValues = Pick<
    RecurringSeriesFormValues,
    'repeat' | 'customInterval' | 'customUnit' | 'anchorDate' | 'endMode' | 'endsOn' | 'endsAfterCount'
>;

export const resolveRecurringSchedule = (
    values: ScheduleFormValues
): Pick<RecurringSeriesEntityInterface, 'cadenceUnit' | 'cadenceInterval' | 'anchorDate' | 'endsAt'> => {
    const cadence =
        values.repeat === RecurringRepeatChoiceEnum.CUSTOM
            ? { cadenceUnit: values.customUnit, cadenceInterval: values.customInterval }
            : RECURRING_REPEAT_CADENCE[values.repeat];
    const anchorDate = startOfDay(values.anchorDate);

    if (values.endMode === RecurringEndModeEnum.ON_DATE) {
        return { ...cadence, anchorDate, endsAt: startOfDay(values.endsOn) };
    }

    if (values.endMode === RecurringEndModeEnum.AFTER_COUNT) {
        const endsAt = nextOccurrences({ ...cadence, anchorDate, endsAt: null }, anchorDate, values.endsAfterCount).at(-1) ?? null;

        return { ...cadence, anchorDate, endsAt };
    }

    return { ...cadence, anchorDate, endsAt: null };
};
