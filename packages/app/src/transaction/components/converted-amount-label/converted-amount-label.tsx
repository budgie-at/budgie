import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useConvertedAmount } from '../../hook/use-converted-amount.hook';

interface Props {
    readonly instrumentId: number;
    readonly amount: number;
    readonly baseAmount: number | null;
}

export const ConvertedAmountLabel = ({ instrumentId, amount, baseAmount }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const liveConversion = useConvertedAmount(instrumentId, defaultInstrument.id, amount);

    const convertedAmount = isDefined(baseAmount) ? baseAmount : liveConversion?.amount;

    if (!isDefined(convertedAmount)) {
        return null;
    }

    return (
        <Text className="text-[13px] text-secondary-foreground/70 text-right tabular-nums">
            {formatDigits(convertFromMicroUnits(convertedAmount), defaultInstrument.symbol)}
        </Text>
    );
};
