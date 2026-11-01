import { InstrumentTypeEnum, convertToMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPositionRow } from '../currency-market-position-row/currency-market-position-row';
import { CurrencyMarketReturnRow } from '../currency-market-return-row/currency-market-return-row';

import type { CryptoPositionInterface } from '@budgie/market';

interface Props {
    readonly position: CryptoPositionInterface;
    readonly valuationRate: number | null;
    readonly balance: number;
    readonly instrumentCode: string;
    readonly staleNote: string | null;
}

const MIN_FRACTION_DIGITS = 2;
const SECONDARY_VALUE_CLASSNAME = 'text-secondary-foreground';

export const CurrencyMarketReturnRows = ({ position, valuationRate, balance, instrumentCode, staleNote }: Props) => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatMoney = useDisplayFormatDigits();
    const formatAverageCost = useFormatDigits(MIN_FRACTION_DIGITS, getMarketPriceFractionDigits(position.averageCost ?? 0));
    const formatInstrumentAmount = useFormatInstrumentAmount();

    const coveredAmount = formatInstrumentAmount(position.amount, '', InstrumentTypeEnum.CRYPTO);
    const coveredAmountWithCode = formatInstrumentAmount(position.amount, instrumentCode, InstrumentTypeEnum.CRYPTO);
    const totalAmount = formatInstrumentAmount(balance, instrumentCode, InstrumentTypeEnum.CRYPTO);
    const isPartiallyCovered = convertToMicroUnits(position.amount) < convertToMicroUnits(balance);
    const costBasisNote = isPartiallyCovered ? t`Known for ${coveredAmount} of ${totalAmount}` : null;
    const returnNote = staleNote ?? (isPartiallyCovered ? t`On the ${coveredAmountWithCode} with known cost` : null);
    const averageCostLabel = isDefined(position.averageCost) ? formatAverageCost(position.averageCost, symbol) : t`Unavailable`;

    if (!isDefined(position.costBasis)) {
        return (
            <CurrencyMarketPositionRow
                label={t`Return`}
                value={t`Unavailable`}
                valueClassName={SECONDARY_VALUE_CLASSNAME}
                testID={CurrencyMarketPageSelector.UnrealizedProfit(instrumentCode)}
            />
        );
    }

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
                subtitle={costBasisNote}
            />
            <CurrencyMarketReturnRow
                position={position}
                valuationRate={valuationRate}
                instrumentCode={instrumentCode}
                subtitle={returnNote}
            />
        </>
    );
};
