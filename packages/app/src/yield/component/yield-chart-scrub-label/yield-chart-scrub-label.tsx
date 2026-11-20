import { useAtomValue } from '@effect/atom-react/Hooks';
import { useState } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useYieldPriorLabel } from '../../hook/use-yield-prior-label.hook';
import { clampYieldLabelLeft } from '../../utils/clamp-yield-label-left.util';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly title: string;
    readonly amount: number;
    readonly priorAmount: number | null;
    readonly x: number;
    readonly plotWidth: number;
}

const LABEL_TOP = 0;
const ESTIMATED_WIDTH = 220;

export const YieldChartScrubLabel = ({ title, amount, priorAmount, x, plotWidth }: Props) => {
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const priorLabel = useYieldPriorLabel();
    const [measuredWidth, setMeasuredWidth] = useState(ESTIMATED_WIDTH);

    const style = { left: clampYieldLabelLeft(x, measuredWidth, 0, plotWidth), top: LABEL_TOP };
    const current = `${title} · ${formatAmount(amount, symbol)}`;
    const prior = isDefined(priorAmount) ? `  ${priorLabel} ${formatAmount(priorAmount, symbol)}` : null;

    const handleLayout = (event: LayoutChangeEvent) => void setMeasuredWidth(event.nativeEvent.layout.width);

    return (
        <Text
            pointerEvents="none"
            numberOfLines={1}
            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
            className="absolute text-[13px] font-semibold leading-[16px] tabular-nums text-primary"
            style={style}
            onLayout={handleLayout}
        >
            {current}
            {isDefined(prior) ? <Text className="text-secondary-foreground">{prior}</Text> : null}
        </Text>
    );
};
