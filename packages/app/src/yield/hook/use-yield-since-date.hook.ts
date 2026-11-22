import { YieldRangeEnum } from '@budgie/market';
import { parseISO } from 'date-fns/parseISO';
import { use } from 'react';

import { useToday } from '../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { YieldScreenContext } from '../context/yield-screen.context';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldSinceDate = (summary: Pick<YieldSummaryInterface, 'firstYieldDay' | 'windowStart'>): string => {
    const { screenKey } = use(YieldScreenContext);
    const today = useToday();
    const { formatDayAndMonthAndYear, formatMonthAndDay } = useFormatDate();

    const isAll = screenKey.key.range === YieldRangeEnum.ALL;
    const day = parseISO(isAll ? (summary.firstYieldDay ?? summary.windowStart) : summary.windowStart);

    return day.getFullYear() === today.getFullYear() ? formatMonthAndDay(day) : formatDayAndMonthAndYear(day);
};
