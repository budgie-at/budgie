import { parseISO } from 'date-fns/parseISO';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { isMarketPriceStale } from '../utils/is-market-price-stale.util';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';

export const useMarketPriceHeroSuffix = (
    latestPrice: InstrumentDailyMarketPriceEntityInterface | undefined,
    scrubbedPrice: InstrumentDailyMarketPriceEntityInterface | null | undefined,
    rangeLabel: string,
    rangeStartDate: string | null
) => {
    const { formatMonthAndDay, formatMonthAndDayAndOptionalYear } = useFormatDate();

    const stalePriceDate = isDefined(latestPrice) && isMarketPriceStale(latestPrice.priceDate) ? latestPrice.priceDate : null;

    const formatWindow = (startDate: string, endDate: string, formatDate: (date: Date) => string) =>
        `${formatDate(parseISO(startDate))} – ${formatDate(parseISO(endDate))}`;

    if (isDefined(scrubbedPrice)) {
        return {
            stalePriceDate,
            suffixLabel: isDefined(rangeStartDate)
                ? formatWindow(rangeStartDate, scrubbedPrice.priceDate, formatMonthAndDayAndOptionalYear)
                : formatMonthAndDayAndOptionalYear(parseISO(scrubbedPrice.priceDate))
        };
    }

    return {
        stalePriceDate,
        suffixLabel:
            isDefined(stalePriceDate) && isDefined(rangeStartDate)
                ? formatWindow(rangeStartDate, stalePriceDate, formatMonthAndDay)
                : rangeLabel
    };
};
