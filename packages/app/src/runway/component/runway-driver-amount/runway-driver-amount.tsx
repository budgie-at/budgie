import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { RUNWAY_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/runway-max-font-size-multiplier.constant';

interface Props {
    readonly monthlyAmount: number;
}

export const RunwayDriverAmount = ({ monthlyAmount }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useFormatDigits(0);

    return (
        <ProtectedText
            numberOfLines={1}
            maxFontSizeMultiplier={RUNWAY_MAX_FONT_SIZE_MULTIPLIER}
            className="text-[15px] font-medium text-primary tabular-nums"
        >
            {formatDigits(convertFromMicroUnits(monthlyAmount), defaultInstrument.symbol)}
        </ProtectedText>
    );
};
