import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { calculateCryptoReturn } from '../../utils/calculate-crypto-return.util';
import { getMarketChangeSign } from '../../utils/get-market-change-sign.util';
import { getMarketMoveClassName } from '../../utils/get-market-move-class-name.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';

import type { InstrumentPositionInterface } from '@budgie/market';

interface Props {
    readonly position: InstrumentPositionInterface;
    readonly valuationRate: number | null;
    readonly balance: number;
    readonly instrumentCode: string;
    readonly subtitle: string | null;
}

const PERCENT_FRACTION_DIGITS = 2;
const PERCENT = 100;

export const CurrencyMarketReturnRow = ({ position, valuationRate, balance, instrumentCode, subtitle }: Props) => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatMoney = useDisplayFormatDigits();
    const formatPercent = useFormatDigits(PERCENT_FRACTION_DIGITS);
    const isAmountProtected = useIsAmountProtected();

    const cryptoReturn = calculateCryptoReturn(position, valuationRate, balance);
    const sign = getMarketChangeSign(cryptoReturn?.profit ?? 0);
    const percentLabel = isDefined(cryptoReturn?.percent)
        ? ` (${getMarketChangeSign(cryptoReturn.percent)}${formatPercent(Math.abs(cryptoReturn.percent))}%)`
        : '';
    const returnLabel = isDefined(cryptoReturn)
        ? `${sign}${formatMoney(Math.abs(cryptoReturn.profit), symbol)}${percentLabel}`
        : t`Unavailable`;
    const returnShare = isDefined(cryptoReturn?.percent) ? cryptoReturn.percent / PERCENT : (cryptoReturn?.profit ?? 0);
    const returnClassName =
        isDefined(cryptoReturn) && !isAmountProtected ? getMarketMoveClassName(returnShare) : 'text-secondary-foreground';

    return (
        <CurrencyMarketPositionRow
            label={t`Return`}
            value={returnLabel}
            valueClassName={returnClassName}
            testID={CurrencyMarketPageSelector.UnrealizedProfit(instrumentCode)}
            subtitle={subtitle}
        />
    );
};
