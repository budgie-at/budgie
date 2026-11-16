import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
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
        <Text
            className="text-[13px] leading-[18px] text-secondary-foreground text-right tabular-nums"
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
        >
            {formatDigits(convertFromMicroUnits(convertedAmount), defaultInstrument.symbol)}
        </Text>
    );
};
