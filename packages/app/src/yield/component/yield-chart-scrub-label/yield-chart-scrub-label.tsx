import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { clampYieldLabelLeft } from '../../utils/clamp-yield-label-left.util';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly title: string;
    readonly x: number;
    readonly plotWidth: number;
}

const LABEL_TOP = 0;
const WRAPPER_SPANS = 2;
const HALF = 2;

export const YieldChartScrubLabel = ({ title, x, plotWidth }: Props) => {
    const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

    const wrapperStyle = { left: x - plotWidth, width: plotWidth * WRAPPER_SPANS, top: LABEL_TOP };
    const shift = isDefined(measuredWidth) ? clampYieldLabelLeft(x, measuredWidth, 0, plotWidth) - (x - measuredWidth / HALF) : 0;
    const style = { transform: [{ translateX: shift }] };

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
                {title}
            </Text>
        </View>
    );
};
