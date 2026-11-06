import { RecurringCadenceUnitEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';

import { useRecurringCadenceLabel } from './use-recurring-cadence-label.hook';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

export const useRecurringScheduleDescription = () => {
    const { t } = useLingui();
    const { formatWeekday, formatMonthAndDay } = useFormatDate();
    const getCadenceLabel = useRecurringCadenceLabel();

    return (series: Pick<RecurringSeriesListItemInterface, 'cadenceUnit' | 'cadenceInterval' | 'nextDate'>, anchorDate: Date): string => {
        const { cadenceUnit, cadenceInterval, nextDate } = series;

        if (!isDefined(nextDate) || cadenceInterval !== 1) {
            return getCadenceLabel(cadenceUnit, cadenceInterval);
        }

        const weekday = formatWeekday(anchorDate);
        const dayOfMonth = anchorDate.getDate();
        const monthAndDay = formatMonthAndDay(anchorDate);

        if (cadenceUnit === RecurringCadenceUnitEnum.WEEK) {
            return t`Every ${weekday}`;
        }

        if (cadenceUnit === RecurringCadenceUnitEnum.MONTH) {
            return t`Every month on day ${dayOfMonth}`;
        }

        return t`Every year on ${monthAndDay}`;
    };
};
