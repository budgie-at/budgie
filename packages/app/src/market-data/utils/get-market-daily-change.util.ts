import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';

export const getMarketDailyChange = (
    latestPrice: Pick<InstrumentDailyMarketPriceEntityInterface, 'price'> | undefined,
    previousPrice: Pick<InstrumentDailyMarketPriceEntityInterface, 'price'> | undefined
): number | null => {
    if (!isDefined(latestPrice) || !isDefined(previousPrice) || !isPositiveNumber(previousPrice.price)) {
        return null;
    }

    return (latestPrice.price - previousPrice.price) / previousPrice.price;
};
