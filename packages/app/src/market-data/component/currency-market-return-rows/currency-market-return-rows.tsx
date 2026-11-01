import { InstrumentTypeEnum, convertToMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { PROTECTED_CAPTION_PLACEHOLDER } from '../../../@generic/constant/protected-caption-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { CurrencyMarketCostBasisRow } from '../currency-market-cost-basis-row/currency-market-cost-basis-row';
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

export const CurrencyMarketReturnRows = ({ position, valuationRate, balance, instrumentCode, staleNote }: Props) => {
    const { t } = useLingui();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const isAmountProtected = useIsAmountProtected();

    const coveredAmountWithCode = isAmountProtected
        ? `${PROTECTED_CAPTION_PLACEHOLDER} ${instrumentCode}`
        : formatInstrumentAmount(position.amount, instrumentCode, InstrumentTypeEnum.CRYPTO);
    const isPartiallyCovered = convertToMicroUnits(position.amount) < convertToMicroUnits(balance);
    const partialNote = isDefined(staleNote)
        ? t`At last known price · on the ${coveredAmountWithCode} with known cost`
        : t`On the ${coveredAmountWithCode} with known cost`;
    const returnNote = isPartiallyCovered ? partialNote : staleNote;

    if (!isDefined(position.costBasis)) {
        return (
            <CurrencyMarketPositionRow
                label={t`Return`}
                value={t`Unavailable`}
                valueClassName="text-secondary-foreground"
                testID={CurrencyMarketPageSelector.UnrealizedProfit(instrumentCode)}
            />
        );
    }

    return (
        <>
            <CurrencyMarketCostBasisRow
                position={position}
                costBasis={position.costBasis}
                balance={balance}
                instrumentCode={instrumentCode}
                isPartiallyCovered={isPartiallyCovered}
            />
            <CurrencyMarketReturnRow
                position={position}
                valuationRate={valuationRate}
                balance={balance}
                instrumentCode={instrumentCode}
                subtitle={returnNote}
            />
        </>
    );
};
