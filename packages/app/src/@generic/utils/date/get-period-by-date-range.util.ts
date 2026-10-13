import { DatePeriodEnum, DateRangeInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { getDateFilterByPeriod } from './get-date-filter-by-period.util';

export const getPeriodByDateRange = (range: DateRangeInterface | null): DatePeriodEnum | null => {
    if (!isDefined(range) || (!isDefined(range.from) && !isDefined(range.to))) {
        return DatePeriodEnum.ALL_TIME;
    }

    return (
        Object.values(DatePeriodEnum).find(period => {
            const periodRange = getDateFilterByPeriod(period);

            return range.from?.getTime() === periodRange.from?.getTime() && range.to?.getTime() === periodRange.to?.getTime();
        }) ?? null
    );
};
