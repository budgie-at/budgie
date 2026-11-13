import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { useUnitValuationRateQuery } from '../../exchange-rate/query/use-unit-valuation-rate.query';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { useFormatGainPercent } from '../../i18n/hook/use-format-gain-percent.hook';
import { useInstrumentMarketDataQuery } from '../../market-data/query/use-instrument-market-data.query';
import { getMarketDailyChange } from '../../market-data/utils/get-market-daily-change.util';
import { getMarketPriceFractionDigits } from '../../market-data/utils/get-market-price-fraction-digits.util';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

const MISSING_VALUE = '—';

export const useAccountDetailsMarketSummary = (instrumentId: number) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { latestPrice, previousPrice } = useInstrumentMarketDataQuery(instrumentId, defaultInstrument.id);
    const formatPercent = useFormatGainPercent();
    const valuationRate = useUnitValuationRateQuery(instrumentId, defaultInstrument.id);
    const price = valuationRate ?? latestPrice?.price;
    const formatPrice = useFormatDigits(getMarketPriceFractionDigits(price ?? 0));

    const change = getMarketDailyChange(latestPrice, previousPrice);

    return {
        priceLabel: isDefined(price) ? formatPrice(price, defaultInstrument.symbol) : MISSING_VALUE,
        change,
        priceDate: latestPrice?.priceDate ?? null,
        changeShare: isDefined(change) ? formatPercent(change) : null
    };
};
