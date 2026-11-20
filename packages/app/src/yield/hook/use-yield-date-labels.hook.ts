import { YieldBucketUnitEnum, YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { format } from 'date-fns/format';
import { getQuarter } from 'date-fns/getQuarter';
import { parseISO } from 'date-fns/parseISO';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';

import type { YieldBucketInterface } from '@budgie/market';

export const useYieldDateLabels = () => {
    const { t } = useLingui();
    const { formatMonthAndDay, formatShortMonth, formatMonthAndYear, formatYear, formatDayAndMonthAndYear } = useFormatDate();

    const formatQuarter = (date: Date) => {
        const quarter = getQuarter(date);
        const year = formatYear(date);

        return t`Q${quarter} ${year}`;
    };
    const formatWeek = (date: Date) => {
        const day = formatMonthAndDay(date);

        return t`Week of ${day}`;
    };
    const tickFormatters: Record<YieldBucketUnitEnum, (date: Date) => string> = {
        [YieldBucketUnitEnum.DAY]: formatMonthAndDay,
        [YieldBucketUnitEnum.WEEK]: formatMonthAndDay,
        [YieldBucketUnitEnum.MONTH]: formatShortMonth,
        [YieldBucketUnitEnum.QUARTER]: formatQuarter,
        [YieldBucketUnitEnum.YEAR]: formatYear
    };
    const periodFormatters: Record<YieldBucketUnitEnum, (date: Date) => string> = {
        [YieldBucketUnitEnum.DAY]: formatDayAndMonthAndYear,
        [YieldBucketUnitEnum.WEEK]: formatWeek,
        [YieldBucketUnitEnum.MONTH]: formatMonthAndYear,
        [YieldBucketUnitEnum.QUARTER]: formatQuarter,
        [YieldBucketUnitEnum.YEAR]: formatYear
    };

    const formatTick = (bucket: Pick<YieldBucketInterface, 'start'>, unit: YieldBucketUnitEnum, isYearVisible = false) => {
        const date = parseISO(bucket.start);

        if (isYearVisible && unit === YieldBucketUnitEnum.MONTH) {
            const month = formatShortMonth(date);
            const year = format(date, 'yy');

            return t`${month} ’${year}`;
        }

        return tickFormatters[unit](date);
    };

    const formatPeriod = (bucket: Pick<YieldBucketInterface, 'start' | 'isInProgress'>, unit: YieldBucketUnitEnum) => {
        const label = periodFormatters[unit](parseISO(bucket.start));

        return bucket.isInProgress ? t({ id: 'passive-income.chart.so-far', message: `${label} so far` }) : label;
    };

    const formatRangeCaption = (range: YieldRangeEnum, windowStart: string) => {
        const start = parseISO(windowStart);
        const day = formatMonthAndDay(start);
        const fullDay = formatDayAndMonthAndYear(start);
        const month = formatMonthAndYear(start);
        const captions: Record<YieldRangeEnum, string> = {
            [YieldRangeEnum.MONTH]: t`in the last 30 days`,
            [YieldRangeEnum.QUARTER]: t`since ${day}`,
            [YieldRangeEnum.YEAR]: t`since ${fullDay}`,
            [YieldRangeEnum.ALL]: t`since ${month}`
        };

        return captions[range];
    };

    return { formatTick, formatPeriod, formatRangeCaption };
};
