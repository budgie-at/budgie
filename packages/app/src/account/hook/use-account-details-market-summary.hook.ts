import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useUnitValuationRateQuery } from '../../exchange-rate/query/use-unit-valuation-rate.query';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { useFormatGainPercent } from '../../i18n/hook/use-format-gain-percent.hook';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';
import { useInstrumentMarketDataQuery } from '../../market-data/query/use-instrument-market-data.query';
import { getMarketDailyChange } from '../../market-data/utils/get-market-daily-change.util';
import { getMarketPriceFractionDigits } from '../../market-data/utils/get-market-price-fraction-digits.util';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

const MISSING_VALUE = '—';

export const useAccountDetailsMarketSummary = (instrumentId: number, quoteInstrumentId: number | null) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { latestPrice, previousPrice } = useInstrumentMarketDataQuery(instrumentId, quoteInstrumentId ?? defaultInstrument.id);
    const { instrument: quoteInstrument } = useGetInstrumentByIdQuery(quoteInstrumentId ?? defaultInstrument.id);
    const formatPercent = useFormatGainPercent();
    const valuationRate = useUnitValuationRateQuery(instrumentId, defaultInstrument.id);
    const price = valuationRate ?? latestPrice?.price;
    const formatPrice = useFormatDigits(getMarketPriceFractionDigits(price ?? 0));
    const formatQuote = useFormatDigits(getMarketPriceFractionDigits(latestPrice?.price ?? 0));

    const change = getMarketDailyChange(latestPrice, previousPrice);
    const defaultPriceLabel = isDefined(price) ? formatPrice(price, defaultInstrument.symbol) : MISSING_VALUE;
    const isForeignQuote = isDefined(latestPrice) && isDefined(quoteInstrument) && quoteInstrument.id !== defaultInstrument.id;
    const quotePriceLabel = isForeignQuote ? formatQuote(latestPrice.price, quoteInstrument.symbol) : '';

    return {
        priceLabel: isForeignQuote ? t`${quotePriceLabel} ≈ ${defaultPriceLabel}` : defaultPriceLabel,
        change,
        priceDate: latestPrice?.priceDate ?? null,
        changeShare: isDefined(change) ? formatPercent(change) : null
    };
};
