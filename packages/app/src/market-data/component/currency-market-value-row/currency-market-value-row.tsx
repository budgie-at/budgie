import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';
import { getReconcilingPriceFractionDigits } from '../../utils/get-reconciling-price-fraction-digits.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';

interface Props {
    readonly latestPrice: Pick<InstrumentDailyMarketPriceEntityInterface, 'price' | 'quoteInstrumentId'> | undefined;
    readonly balance: number;
    readonly positionAmount: number;
    readonly valuationRate: number;
    readonly instrumentCode: string;
    readonly isStale: boolean;
}

const MIN_FRACTION_DIGITS = 2;

export const CurrencyMarketValueRow = ({ latestPrice, balance, positionAmount, valuationRate, instrumentCode, isStale }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { instrument: quoteInstrument } = useGetInstrumentByIdQuery(latestPrice?.quoteInstrumentId ?? defaultInstrument.id);
    const formatQuote = useFormatDigits(MIN_FRACTION_DIGITS, getMarketPriceFractionDigits(latestPrice?.price ?? 0));
    const formatMoney = useDisplayFormatDigits();
    const reconcilingDigits = getReconcilingPriceFractionDigits(valuationRate, [balance, positionAmount], MIN_FRACTION_DIGITS);
    const formatRate = useFormatDigits(MIN_FRACTION_DIGITS, reconcilingDigits ?? getMarketPriceFractionDigits(valuationRate));

    const rateLabel = formatRate(valuationRate, defaultInstrument.symbol);
    const isForeignQuote = isDefined(latestPrice) && isDefined(quoteInstrument) && quoteInstrument.id !== defaultInstrument.id;
    const quoteLabel = isForeignQuote ? formatQuote(latestPrice.price, quoteInstrument.symbol) : '';
    const exactSubtitle = isStale ? t`At last known price, ${rateLabel} per ${instrumentCode}` : t`At ${rateLabel} per ${instrumentCode}`;
    const approximateSubtitle = isStale
        ? t`At last known price, ≈ ${rateLabel} per ${instrumentCode}`
        : t`At ≈ ${rateLabel} per ${instrumentCode}`;
    const localSubtitle = isDefined(reconcilingDigits) ? exactSubtitle : approximateSubtitle;
    const subtitle = isForeignQuote ? t`At ${quoteLabel} ≈ ${rateLabel} per ${instrumentCode}` : localSubtitle;

    return (
        <CurrencyMarketPositionRow
            label={t`Value`}
            value={formatMoney(balance * valuationRate, defaultInstrument.symbol)}
            valueClassName="text-primary font-semibold"
            testID={CurrencyMarketPageSelector.HoldingsValue(instrumentCode)}
            subtitle={subtitle}
        />
    );
};
