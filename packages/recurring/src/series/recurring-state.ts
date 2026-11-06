import { RecurringSeriesSourceEnum, RecurringSeriesUserStateEnum } from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined } from '@rnw-community/shared';

import { RECURRING_ACTIVE_CONFIDENCE } from '../constant/recurring-active-confidence.constant';

import { cadencePeriodDays } from './recurring-schedule';
import { ACTIVE_PERIOD_RATIO } from './recurring-series';

import type { StateSeriesType } from '../type/state-series.type';

export const countsInForecasts = (series: Pick<StateSeriesType, 'source' | 'userState' | 'confidence' | 'deletedAt'>): boolean =>
    !isDefined(series.deletedAt) &&
    series.userState !== RecurringSeriesUserStateEnum.DISMISSED &&
    (series.userState === RecurringSeriesUserStateEnum.CONFIRMED ||
        series.source === RecurringSeriesSourceEnum.MANUAL ||
        series.confidence >= RECURRING_ACTIVE_CONFIDENCE);

export const isSeriesEnded = (series: StateSeriesType, now: Date): boolean => {
    if (isDefined(series.endsAt) && differenceInCalendarDays(startOfDay(now), series.endsAt) > 0) {
        return true;
    }

    return (
        series.source === RecurringSeriesSourceEnum.DETECTED &&
        differenceInCalendarDays(now, series.lastSeenAt) > cadencePeriodDays(series) * ACTIVE_PERIOD_RATIO
    );
};

export const isSeriesActiveNow = (series: StateSeriesType, now: Date): boolean => countsInForecasts(series) && !isSeriesEnded(series, now);
