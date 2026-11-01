import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { useInstrumentMarketDataQuery } from '../../market-data/query/use-instrument-market-data.query';
import { getMarketDailyChange } from '../../market-data/utils/get-market-daily-change.util';
import { getMarketPriceFractionDigits } from '../../market-data/utils/get-market-price-fraction-digits.util';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

const MISSING_VALUE = '—';
const PERCENT = 100;
const PERCENT_FRACTION_DIGITS = 2;

export const useAccountDetailsMarketSummary = (instrumentId: number) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { latestPrice, previousPrice } = useInstrumentMarketDataQuery(instrumentId, defaultInstrument.id);
    const formatPercent = useFormatDigits(PERCENT_FRACTION_DIGITS);
    const formatPrice = useFormatDigits(getMarketPriceFractionDigits(latestPrice?.price ?? 0));

    const price = latestPrice?.price;
    const change = getMarketDailyChange(latestPrice, previousPrice);

    return {
        priceLabel: isDefined(price) ? formatPrice(price, defaultInstrument.symbol) : MISSING_VALUE,
        change,
        priceDate: latestPrice?.priceDate ?? null,
        changeShare: isDefined(change) ? `${formatPercent(Math.abs(change * PERCENT))}%` : null
    };
};
