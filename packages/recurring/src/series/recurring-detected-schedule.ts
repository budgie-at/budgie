import { RecurringCadenceUnitEnum } from '@budgie/contracts';
import { getDaysInMonth } from 'date-fns/getDaysInMonth';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined } from '@rnw-community/shared';

import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';

const WEEK_DAYS = 7;
const YEARLY_MONTHS = 12;

const isMonthEnd = (date: Date): boolean => date.getDate() === getDaysInMonth(date);

const monthEndAnchor = (series: RecurringSeriesInterface): number =>
    series.events
        .filter(event => isMonthEnd(new Date(event.timestamp)))
        .reduce(
            (anchor, event) => (new Date(event.timestamp).getDate() >= new Date(anchor).getDate() ? event.timestamp : anchor),
            series.anchorTimestamp
        );

export const buildDetectedSchedule = (series: RecurringSeriesInterface) => {
    if (!isDefined(series.periodMonths)) {
        return {
            cadenceUnit: RecurringCadenceUnitEnum.WEEK,
            cadenceInterval: Math.max(1, Math.round(series.periodDays / WEEK_DAYS)),
            anchorDate: startOfDay(new Date(series.anchorTimestamp))
        };
    }
    const isYearly = series.periodMonths === YEARLY_MONTHS;

    return {
        cadenceUnit: isYearly ? RecurringCadenceUnitEnum.YEAR : RecurringCadenceUnitEnum.MONTH,
        cadenceInterval: isYearly ? 1 : series.periodMonths,
        anchorDate: startOfDay(new Date(isMonthEnd(new Date(series.anchorTimestamp)) ? monthEndAnchor(series) : series.anchorTimestamp))
    };
};
