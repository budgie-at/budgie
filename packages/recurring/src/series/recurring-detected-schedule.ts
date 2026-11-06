import { RecurringCadenceUnitEnum } from '@budgie/contracts';
import { getDaysInMonth } from 'date-fns/getDaysInMonth';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined } from '@rnw-community/shared';

import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';

const WEEK_DAYS = 7;

const billingDay = (series: RecurringSeriesInterface): number => {
    let day = new Date(series.anchorTimestamp).getDate();
    for (const event of [...series.events].reverse()) {
        const date = new Date(event.timestamp);
        day = Math.max(day, date.getDate());
        if (date.getDate() < getDaysInMonth(date)) {
            break;
        }
    }

    return day;
};

export const buildDetectedSchedule = (series: RecurringSeriesInterface) => {
    if (!isDefined(series.periodMonths)) {
        return {
            cadenceUnit: RecurringCadenceUnitEnum.WEEK,
            cadenceInterval: Math.max(1, Math.round(series.periodDays / WEEK_DAYS)),
            anchorDate: startOfDay(new Date(series.anchorTimestamp))
        };
    }
    const day = billingDay(series);
    const anchorEvent = [...series.events].reverse().find(event => new Date(event.timestamp).getDate() === day);
    const isYearly = series.periodMonths === 12;

    return {
        cadenceUnit: isYearly ? RecurringCadenceUnitEnum.YEAR : RecurringCadenceUnitEnum.MONTH,
        cadenceInterval: isYearly ? 1 : series.periodMonths,
        anchorDate: startOfDay(new Date(anchorEvent?.timestamp ?? series.anchorTimestamp))
    };
};
