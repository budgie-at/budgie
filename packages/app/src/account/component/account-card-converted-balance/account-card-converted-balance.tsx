import { useAtomValue } from '@effect/atom-react/Hooks';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { toTrueMinus } from '../../../@generic/utils/to-true-minus.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly instrumentId: number;
    readonly convertedBalance: number | null;
}

export const AccountCardConvertedBalance = ({ instrumentId, convertedBalance }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();

    if (!isDefined(convertedBalance) || instrumentId === defaultInstrument.id) {
        return null;
    }

    return (
        <ProtectedText
            numberOfLines={1}
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            className="text-[13px] text-secondary-foreground tabular-nums"
        >
            {`≈ ${toTrueMinus(formatDigits(convertedBalance, defaultInstrument.symbol))}`}
        </ProtectedText>
    );
};
