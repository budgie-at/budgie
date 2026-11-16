import { useAtomValue } from '@effect/atom-react/Hooks';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-primary-max-font-size-multiplier.constant';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly amount: number;
    readonly testID: string;
}

export const HomeAmountValue = ({ amount, testID }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    return (
        <ProtectedText
            className="text-[17px] font-semibold tracking-tight tabular-nums text-primary"
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            numberOfLines={1}
            maxFontSizeMultiplier={ROW_PRIMARY_MAX_FONT_SIZE_MULTIPLIER}
            testID={testID}
        >
            {formatDigits(amount, defaultInstrument.symbol)}
        </ProtectedText>
    );
};
