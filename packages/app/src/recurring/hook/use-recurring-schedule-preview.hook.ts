import { nextOccurrences } from '@budgie/recurring';
import { useLingui } from '@lingui/react/macro';
import { addDays } from 'date-fns/addDays';
import { useFormContext, useWatch } from 'react-hook-form';

import { isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { RecurringEndModeEnum } from '../enum/recurring-end-mode.enum';
import { RecurringRepeatChoiceEnum } from '../enum/recurring-repeat-choice.enum';
import { resolveRecurringSchedule } from '../utils/resolve-recurring-schedule.util';

import type { RecurringSeriesFormValues } from '../constant/recurring-series-form-schema.constant';

const PREVIEW_COUNT = 3;

export const useRecurringSchedulePreview = (): string | null => {
    const { t } = useLingui();
    const { control } = useFormContext<RecurringSeriesFormValues>();
    const { formatMonthAndDay } = useFormatDate();
    const [repeat, customInterval, customUnit, anchorDate, endMode, endsOn, endsAfterCount] = useWatch({
        control,
        name: ['repeat', 'customInterval', 'customUnit', 'anchorDate', 'endMode', 'endsOn', 'endsAfterCount']
    });

    const isIntervalValid = repeat !== RecurringRepeatChoiceEnum.CUSTOM || isPositiveNumber(customInterval);
    const isCountValid = endMode !== RecurringEndModeEnum.AFTER_COUNT || isPositiveNumber(endsAfterCount);

    if (!isIntervalValid || !isCountValid) {
        return null;
    }

    const schedule = resolveRecurringSchedule({ repeat, customInterval, customUnit, anchorDate, endMode, endsOn, endsAfterCount });
    const upcoming = nextOccurrences(schedule, addDays(schedule.anchorDate, 1), PREVIEW_COUNT + 1);

    if (isEmptyArray(upcoming)) {
        return t`Only one payment`;
    }

    const dates = upcoming.slice(0, PREVIEW_COUNT).map(formatMonthAndDay).join(', ');

    return upcoming.length > PREVIEW_COUNT ? t`Then ${dates}…` : t`Then ${dates}`;
};
