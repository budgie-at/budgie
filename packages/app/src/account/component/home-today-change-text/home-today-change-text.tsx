import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { RETURN_ARROW_BY_DIRECTION } from '../../../brokerage/constant/return-arrow-by-direction.constant';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatGainPercent } from '../../../i18n/hook/use-format-gain-percent.hook';
import { getMarketMoveClassName } from '../../../market-data/utils/get-market-move-class-name.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly gain: number | null;
    readonly percent: number | null;
    readonly maxFontSizeMultiplier: number;
    readonly testID: string;
}

export const HomeTodayChangeText = ({ gain, percent, maxFontSizeMultiplier, testID }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const formatGainPercent = useFormatGainPercent();
    const isStacked = useIsAccessibilityTextSize();

    const direction = percent ?? gain ?? 0;
    const change = [
        isDefined(gain) ? formatDigits(Math.abs(gain), defaultInstrument.symbol) : null,
        isDefined(percent) ? formatGainPercent(percent) : null
    ]
        .filter(isDefined)
        .join(' · ');
    const lineCount = isStacked ? 2 : 1;

    return (
        <ProtectedText
            numberOfLines={lineCount}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            className="text-[13px] font-semibold tabular-nums text-secondary-foreground"
            testID={testID}
        >
            <Text className={getMarketMoveClassName(direction)}>{RETURN_ARROW_BY_DIRECTION[Math.sign(direction)]}</Text>
            <Trans>{change} · 24h</Trans>
        </ProtectedText>
    );
};
