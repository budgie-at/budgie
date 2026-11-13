import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { PROTECTED_HERO_PLACEHOLDER } from '../../../@generic/constant/protected-hero-placeholder.constant';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useUnitValuationRateQuery } from '../../../exchange-rate/query/use-unit-valuation-rate.query';
import { MILLION } from '../../../i18n/constant/compact-thresholds.constant';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { getInstrumentUnitLabel } from '../../../instrument/utils/get-instrument-unit-label.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly balance: number;
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'code' | 'symbol' | 'type'>;
}

export const AccountDetailsConvertedValue = ({ balance, instrument }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const valuationRate = useUnitValuationRateQuery(instrument.id, defaultInstrument.id);

    const convertedValue = isDefined(valuationRate) ? balance * valuationRate : null;
    const formattedValue = isDefined(convertedValue) ? formatDigits(convertedValue, defaultInstrument.symbol) : null;
    const approximatePrefix = convertedValue === 0 ? '' : '≈ ';
    const approximateValue = isDefined(formattedValue) ? `${approximatePrefix}${formattedValue}` : null;
    const fullAmount = formatInstrumentAmount(balance, getInstrumentUnitLabel(instrument), instrument.type);
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
