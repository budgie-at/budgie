import { InstrumentTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { PROTECTED_HERO_PLACEHOLDER } from '../../../@generic/constant/protected-hero-placeholder.constant';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useCryptoValuationRateQuery } from '../../../exchange-rate/query/use-crypto-valuation-rate.query';
import { MILLION } from '../../../i18n/constant/compact-thresholds.constant';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly balance: number;
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'code'>;
}

export const AccountDetailsConvertedValue = ({ balance, instrument }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const valuationRate = useCryptoValuationRateQuery(instrument.id, defaultInstrument.id);

    const approximateValue = isDefined(valuationRate) ? `≈ ${formatDigits(balance * valuationRate, defaultInstrument.symbol)}` : null;
    const fullAmount = formatInstrumentAmount(balance, instrument.code, InstrumentTypeEnum.CRYPTO);
    const convertedLabel =
        isDefined(approximateValue) && Math.abs(balance) >= MILLION ? `${fullAmount} · ${approximateValue}` : approximateValue;

    return (
        <ProtectedText
            className="min-h-[20px] text-center text-[15px] leading-[20px] text-secondary-foreground tabular-nums"
            numberOfLines={2}
            placeholderText={`≈ ${PROTECTED_HERO_PLACEHOLDER}`}
            testID={AccountDetailsSelector.ConvertedValue}
        >
            {convertedLabel}
        </ProtectedText>
    );
};
