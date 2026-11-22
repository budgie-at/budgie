import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { isSameDay } from 'date-fns/isSameDay';
import { isSameMonth } from 'date-fns/isSameMonth';
import { isSameWeek } from 'date-fns/isSameWeek';
import { parseISO } from 'date-fns/parseISO';

import { isDefined } from '@rnw-community/shared';

import { useToday } from '../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { YIELD_ALL_TIME_START } from '../constant/yield-all-time-start.constant';

import type { YieldAnalyticsFocusInterface } from '../interface/yield-analytics-focus.interface';
import type { YieldPeriodInterface } from '../interface/yield-period.interface';
import type { YieldSummaryInterface } from '@budgie/market';

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export const useYieldAnalyticsPeriodLabel = (
    summary: Pick<YieldSummaryInterface, 'buckets'> | null,
    focus: YieldAnalyticsFocusInterface,
    period: YieldPeriodInterface
): string => {
    const { t } = useLingui();
    const today = useToday();
    const { formatFullMonthAndYear, formatMonthAndDay } = useFormatDate();

    const { focusDay } = focus;

    if (!isDefined(focusDay)) {
        return period.fromDay === YIELD_ALL_TIME_START ? t`all time` : t`in the selected period`;
    }

    const day = parseISO(focusDay);
    const month = formatFullMonthAndYear(day);
    const dayLabel = formatMonthAndDay(day);
    const dayText = isSameDay(day, today) ? t`today` : t`on ${dayLabel}`;
    const labels: Readonly<Record<YieldRangeEnum, string>> = {
        [YieldRangeEnum.YEAR]: isSameMonth(day, today) ? t`this month` : t`in ${month}`,
        [YieldRangeEnum.QUARTER]: isSameWeek(day, today, WEEK_OPTIONS) ? t`this week` : t`in the week of ${dayLabel}`,
        [YieldRangeEnum.MONTH]: dayText,
        [YieldRangeEnum.ALL]: dayText
    };
    const periodLabel = labels[focus.range];
    const focusedBucket = summary?.buckets.find(bucket => bucket.start <= focusDay && focusDay <= bucket.end);

    return focusedBucket?.isInProgress === true ? t`so far ${periodLabel}` : periodLabel;
};
