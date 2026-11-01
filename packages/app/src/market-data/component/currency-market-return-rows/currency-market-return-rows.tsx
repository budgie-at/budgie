import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { calculateCryptoReturn } from '../../utils/calculate-crypto-return.util';
import { getMarketChangeClassName } from '../../utils/get-market-change-class-name.util';
import { getMarketChangeSign } from '../../utils/get-market-change-sign.util';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';

import type { CryptoPositionInterface } from '@budgie/market';

interface Props {
    readonly position: CryptoPositionInterface;
    readonly valuationRate: number | null;
    readonly instrumentCode: string;
}

const MIN_FRACTION_DIGITS = 2;
const SECONDARY_VALUE_CLASSNAME = 'text-secondary-foreground';

export const CurrencyMarketReturnRows = ({ position, valuationRate, instrumentCode }: Props) => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatMoney = useDisplayFormatDigits();
    const formatPercent = useFormatDigits(MIN_FRACTION_DIGITS);
    const formatAverageCost = useFormatDigits(MIN_FRACTION_DIGITS, getMarketPriceFractionDigits(position.averageCost ?? 0));

    const cryptoReturn = calculateCryptoReturn(position, valuationRate);
    const sign = getMarketChangeSign(cryptoReturn?.profit ?? 0);
    const percentLabel = isDefined(cryptoReturn?.percent) ? ` (${sign}${formatPercent(Math.abs(cryptoReturn.percent))}%)` : '';
    const returnLabel = isDefined(cryptoReturn)
        ? `${sign}${formatMoney(Math.abs(cryptoReturn.profit), symbol)}${percentLabel}`
        : t`No price`;
    const returnClassName = isDefined(cryptoReturn) ? getMarketChangeClassName(cryptoReturn.profit) : SECONDARY_VALUE_CLASSNAME;
    const returnTestID = CurrencyMarketPageSelector.UnrealizedProfit(instrumentCode);

    if (!isDefined(position.costBasis)) {
        return (
            <CurrencyMarketPositionRow
                label={t`Return`}
                value={t`Unavailable`}
                valueClassName={SECONDARY_VALUE_CLASSNAME}
                testID={returnTestID}
            />
        );
    }

    const averageCostLabel = isDefined(position.averageCost) ? formatAverageCost(position.averageCost, symbol) : t`Unavailable`;

    return (
        <>
            <CurrencyMarketPositionRow
                label={t`Average cost`}
                value={averageCostLabel}
                valueClassName={SECONDARY_VALUE_CLASSNAME}
                testID={CurrencyMarketPageSelector.AverageCost(instrumentCode)}
            />
            <CurrencyMarketPositionRow
                label={t`Cost basis`}
                value={formatMoney(position.costBasis, symbol)}
                valueClassName={SECONDARY_VALUE_CLASSNAME}
                testID={CurrencyMarketPageSelector.CostBasis(instrumentCode)}
            />
            <CurrencyMarketPositionRow label={t`Return`} value={returnLabel} valueClassName={returnClassName} testID={returnTestID} />
        </>
    );
};
