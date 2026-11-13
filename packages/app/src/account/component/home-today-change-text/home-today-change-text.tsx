import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatGainPercent } from '../../../i18n/hook/use-format-gain-percent.hook';
import { getMarketMoveClassName } from '../../../market-data/utils/get-market-move-class-name.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly gain: number | null;
    readonly percent: number;
    readonly maxFontSizeMultiplier: number;
    readonly testID: string;
}

const ARROW_BY_DIRECTION: Record<number, string> = { [-1]: '▼ ', 0: '', 1: '▲ ' };

export const HomeTodayChangeText = ({ gain, percent, maxFontSizeMultiplier, testID }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const formatGainPercent = useFormatGainPercent();
    const isStacked = useIsAccessibilityTextSize();

    const change = [isDefined(gain) ? formatDigits(Math.abs(gain), defaultInstrument.symbol) : null, formatGainPercent(percent)]
        .filter(isDefined)
        .join(' · ');
    const lineCount = isStacked ? 2 : 1;

    return (
        <ProtectedText
            numberOfLines={lineCount}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            className={cn('text-[13px] font-semibold tabular-nums', getMarketMoveClassName(percent))}
            testID={testID}
        >
            {`${ARROW_BY_DIRECTION[Math.sign(percent)]}${t`${change} · 24h`}`}
        </ProtectedText>
    );
};
