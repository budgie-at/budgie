import { InstrumentTypeEnum, convertToMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { calculateCryptoReturn } from '../../utils/calculate-crypto-return.util';
import { getMarketChangeClassName } from '../../utils/get-market-change-class-name.util';
import { getMarketChangeSign } from '../../utils/get-market-change-sign.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';

import type { CryptoPositionInterface } from '@budgie/market';

interface Props {
    readonly position: CryptoPositionInterface;
    readonly valuationRate: number | null;
    readonly balance: number;
    readonly instrumentCode: string;
}

const PERCENT_FRACTION_DIGITS = 2;

export const CurrencyMarketReturnRow = ({ position, valuationRate, balance, instrumentCode }: Props) => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatMoney = useDisplayFormatDigits();
    const formatPercent = useFormatDigits(PERCENT_FRACTION_DIGITS);
    const formatInstrumentAmount = useFormatInstrumentAmount();

    const cryptoReturn = calculateCryptoReturn(position, valuationRate);
    const sign = getMarketChangeSign(cryptoReturn?.profit ?? 0);
    const percentLabel = isDefined(cryptoReturn?.percent) ? ` (${sign}${formatPercent(Math.abs(cryptoReturn.percent))}%)` : '';
    const returnLabel = isDefined(cryptoReturn)
        ? `${sign}${formatMoney(Math.abs(cryptoReturn.profit), symbol)}${percentLabel}`
        : t`No price`;
    const returnClassName = isDefined(cryptoReturn) ? getMarketChangeClassName(cryptoReturn.profit) : 'text-secondary-foreground';
    const coveredAmount = formatInstrumentAmount(position.amount, '', InstrumentTypeEnum.CRYPTO);
    const totalAmount = formatInstrumentAmount(balance, instrumentCode, InstrumentTypeEnum.CRYPTO);
    const isPartiallyCovered = convertToMicroUnits(position.amount) < convertToMicroUnits(balance);

    return (
        <CurrencyMarketPositionRow
            label={t`Return`}
            value={returnLabel}
            valueClassName={returnClassName}
            testID={CurrencyMarketPageSelector.UnrealizedProfit(instrumentCode)}
            {...(isPartiallyCovered && { subtitle: t`On ${coveredAmount} of ${totalAmount}` })}
        />
    );
};
