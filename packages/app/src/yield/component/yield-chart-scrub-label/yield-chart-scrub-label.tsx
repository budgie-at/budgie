import { useAtomValue } from '@effect/atom-react/Hooks';
import { useState } from 'react';
import { Text, View } from 'react-native';

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
const WRAPPER_SPANS = 2;
const HALF = 2;

export const YieldChartScrubLabel = ({ title, amount, priorAmount, x, plotWidth }: Props) => {
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const priorLabel = useYieldPriorLabel();
    const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

    const wrapperStyle = { left: x - plotWidth, width: plotWidth * WRAPPER_SPANS, top: LABEL_TOP };
    const shift = isDefined(measuredWidth) ? clampYieldLabelLeft(x, measuredWidth, 0, plotWidth) - (x - measuredWidth / HALF) : 0;
    const style = { transform: [{ translateX: shift }] };
    const current = `${title} · ${formatAmount(amount, symbol)}`;
    const prior = isDefined(priorAmount) ? `  ${priorLabel} ${formatAmount(priorAmount, symbol)}` : null;

    const handleLayout = (event: LayoutChangeEvent) => void setMeasuredWidth(event.nativeEvent.layout.width);

    return (
        <View pointerEvents="none" className="absolute items-center" style={wrapperStyle}>
            <Text
                numberOfLines={1}
                maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                className="text-[13px] font-semibold leading-[16px] tabular-nums text-primary"
                style={style}
                onLayout={handleLayout}
            >
                {current}
                {isDefined(prior) ? <Text className="text-secondary-foreground">{prior}</Text> : null}
            </Text>
        </View>
    );
};
