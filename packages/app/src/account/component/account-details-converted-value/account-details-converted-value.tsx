import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { PROTECTED_HERO_PLACEHOLDER } from '../../../@generic/constant/protected-hero-placeholder.constant';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useCryptoValuationRateQuery } from '../../../exchange-rate/query/use-crypto-valuation-rate.query';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly balance: number;
    readonly instrumentId: number;
}

export const AccountDetailsConvertedValue = ({ balance, instrumentId }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const valuationRate = useCryptoValuationRateQuery(instrumentId, defaultInstrument.id);

    const convertedLabel = isDefined(valuationRate) ? `≈ ${formatDigits(balance * valuationRate, defaultInstrument.symbol)}` : null;

    return (
        <ProtectedText
            className="h-[20px] text-center text-[15px] leading-[20px] text-secondary-foreground tabular-nums"
            numberOfLines={1}
            placeholderText={`≈ ${PROTECTED_HERO_PLACEHOLDER}`}
            testID={AccountDetailsSelector.ConvertedValue}
        >
            {convertedLabel}
        </ProtectedText>
    );
};
