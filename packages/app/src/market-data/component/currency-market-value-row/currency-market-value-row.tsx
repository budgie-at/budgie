import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';
import { getReconcilingPriceFractionDigits } from '../../utils/get-reconciling-price-fraction-digits.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';

interface Props {
    readonly balance: number;
    readonly positionAmount: number;
    readonly valuationRate: number;
    readonly instrumentCode: string;
    readonly isStale: boolean;
}

const MIN_FRACTION_DIGITS = 2;

export const CurrencyMarketValueRow = ({ balance, positionAmount, valuationRate, instrumentCode, isStale }: Props) => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatMoney = useDisplayFormatDigits();
    const reconcilingDigits = getReconcilingPriceFractionDigits(valuationRate, [balance, positionAmount], MIN_FRACTION_DIGITS);
    const formatRate = useFormatDigits(MIN_FRACTION_DIGITS, reconcilingDigits ?? getMarketPriceFractionDigits(valuationRate));

    const rateLabel = formatRate(valuationRate, symbol);
    const exactSubtitle = isStale ? t`At last known price, ${rateLabel} per ${instrumentCode}` : t`At ${rateLabel} per ${instrumentCode}`;
    const approximateSubtitle = isStale
        ? t`At last known price, ≈ ${rateLabel} per ${instrumentCode}`
        : t`At ≈ ${rateLabel} per ${instrumentCode}`;
    const subtitle = isDefined(reconcilingDigits) ? exactSubtitle : approximateSubtitle;

    return (
        <CurrencyMarketPositionRow
            label={t`Value`}
            value={formatMoney(balance * valuationRate, symbol)}
            valueClassName="text-primary font-semibold"
            testID={CurrencyMarketPageSelector.HoldingsValue(instrumentCode)}
            subtitle={subtitle}
        />
    );
};
