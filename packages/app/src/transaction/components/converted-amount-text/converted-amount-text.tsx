import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly amount: number;
}

export const ConvertedAmountText = ({ amount }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    return (
        <Text
            className="text-[13px] leading-[18px] text-secondary-foreground text-right tabular-nums"
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
        >
            {formatDigits(convertFromMicroUnits(amount), defaultInstrument.symbol)}
        </Text>
    );
};
