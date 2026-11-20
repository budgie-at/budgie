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

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export const useYieldAnalyticsPeriodLabel = (focus: YieldAnalyticsFocusInterface, period: YieldPeriodInterface): string => {
    const { t } = useLingui();
    const today = useToday();
    const { formatFullMonthAndYear, formatMonthAndDay } = useFormatDate();

    if (!isDefined(focus.focusDay)) {
        return period.fromDay === YIELD_ALL_TIME_START ? t`all time` : t`in the selected period`;
    }

    const day = parseISO(focus.focusDay);
    const month = formatFullMonthAndYear(day);
    const dayLabel = formatMonthAndDay(day);

    if (focus.range === YieldRangeEnum.YEAR) {
        return isSameMonth(day, today) ? t`this month` : t`in ${month}`;
    }

    if (focus.range === YieldRangeEnum.QUARTER) {
        return isSameWeek(day, today, WEEK_OPTIONS) ? t`this week` : t`in the week of ${dayLabel}`;
    }

    return isSameDay(day, today) ? t`today` : t`on ${dayLabel}`;
};
