import { InstrumentTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { PROTECTED_CAPTION_PLACEHOLDER } from '../../../@generic/constant/protected-caption-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';

import type { InstrumentPositionInterface } from '@budgie/market';

interface Props {
    readonly position: InstrumentPositionInterface;
    readonly costBasis: number;
    readonly balance: number;
    readonly instrumentCode: string;
    readonly isPartiallyCovered: boolean;
}

const MIN_FRACTION_DIGITS = 2;

export const CurrencyMarketCostBasisRow = ({ position, costBasis, balance, instrumentCode, isPartiallyCovered }: Props) => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatMoney = useDisplayFormatDigits();
    const formatAverageCost = useFormatDigits(MIN_FRACTION_DIGITS, getMarketPriceFractionDigits(position.averageCost ?? 0));
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const isAmountProtected = useIsAmountProtected();

    const coveredAmount = isAmountProtected
        ? PROTECTED_CAPTION_PLACEHOLDER
        : formatInstrumentAmount(position.amount, '', InstrumentTypeEnum.CRYPTO);
    const totalAmount = isAmountProtected
        ? `${PROTECTED_CAPTION_PLACEHOLDER} ${instrumentCode}`
        : formatInstrumentAmount(balance, instrumentCode, InstrumentTypeEnum.CRYPTO);
    const formattedAverageCost = isDefined(position.averageCost) ? formatAverageCost(position.averageCost, symbol) : t`Unavailable`;
    const averageCost = isAmountProtected ? PROTECTED_CAPTION_PLACEHOLDER : formattedAverageCost;
    const caption = isPartiallyCovered
        ? t`Avg ${averageCost} per ${instrumentCode} · known for ${coveredAmount} of ${totalAmount}`
        : t`Avg ${averageCost} per ${instrumentCode}`;

    return (
        <CurrencyMarketPositionRow
            label={t`Cost basis`}
            value={formatMoney(costBasis, symbol)}
            valueClassName="text-secondary-foreground"
            testID={CurrencyMarketPageSelector.CostBasis(instrumentCode)}
            subtitle={caption}
            subtitleTestID={CurrencyMarketPageSelector.AverageCost(instrumentCode)}
        />
    );
};
