import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { parseISO } from 'date-fns/parseISO';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';

const CONSECUTIVE_DAYS = 1;

export const getMarketDailyChange = (
    latestPrice: Pick<InstrumentDailyMarketPriceEntityInterface, 'price' | 'priceDate'> | undefined,
    previousPrice: Pick<InstrumentDailyMarketPriceEntityInterface, 'price' | 'priceDate'> | undefined
): number | null => {
    if (!isDefined(latestPrice) || !isDefined(previousPrice) || !isPositiveNumber(previousPrice.price)) {
        return null;
    }

    const gapDays = differenceInCalendarDays(parseISO(latestPrice.priceDate), parseISO(previousPrice.priceDate));

    if (gapDays !== CONSECUTIVE_DAYS) {
        return null;
    }

    return (latestPrice.price - previousPrice.price) / previousPrice.price;
};
