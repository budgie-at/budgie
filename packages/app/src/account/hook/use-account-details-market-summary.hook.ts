import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { useFormatPercent } from '../../i18n/hook/use-format-percent.hook';
import { useInstrumentMarketDataQuery } from '../../market-data/query/use-instrument-market-data.query';
import { getMarketPriceFractionDigits } from '../../market-data/utils/get-market-price-fraction-digits.util';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

const MISSING_VALUE = '—';

export const useAccountDetailsMarketSummary = (instrumentId: number) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { latestPrice, previousPrice } = useInstrumentMarketDataQuery(instrumentId, defaultInstrument.id);
    const formatPercent = useFormatPercent();
    const formatPrice = useFormatDigits(getMarketPriceFractionDigits(latestPrice?.price ?? 0));

    const price = latestPrice?.price;
    const previous = previousPrice?.price;
    const change = isDefined(price) && isDefined(previous) && previous > 0 ? (price - previous) / previous : null;

    return {
        priceLabel: isDefined(price) ? formatPrice(price, defaultInstrument.symbol) : MISSING_VALUE,
        changeShare: isDefined(change) ? formatPercent(Math.abs(change)) : null,
        isUp: isDefined(change) && change >= 0
    };
};
