import { useState } from 'react';
import { Text } from 'react-native';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { clampYieldLabelLeft } from '../../utils/clamp-yield-label-left.util';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly text: string;
    readonly centre: number;
    readonly plotWidth: number;
    readonly glyphWidth?: number;
    readonly className?: string;
}

const SCRUB_GLYPH_WIDTH = 8;

export const YieldChartFloatingLabel = ({
    text,
    centre,
    plotWidth,
    glyphWidth = SCRUB_GLYPH_WIDTH,
    className = 'top-0 text-[13px] font-semibold leading-[16px] text-primary'
}: Props) => {
    const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

    const labelWidth = measuredWidth ?? text.length * glyphWidth;
    const style = { left: clampYieldLabelLeft(centre, labelWidth, 0, plotWidth) };

    const handleLayout = (event: LayoutChangeEvent) => void setMeasuredWidth(event.nativeEvent.layout.width);

    return (
        <Text
            pointerEvents="none"
            numberOfLines={1}
            maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
            className={cn('absolute tabular-nums', className)}
            style={style}
            onLayout={handleLayout}
        >
            {text}
        </Text>
    );
};
