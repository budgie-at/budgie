import { useState } from 'react';
import { Text } from 'react-native';

import { clampYieldLabelLeft } from '../../utils/clamp-yield-label-left.util';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly label: string;
    readonly centre: number;
    readonly plotWidth: number;
}

const TICK_MAX_FONT_SIZE_MULTIPLIER = 1.3;
const ESTIMATED_GLYPH_WIDTH = 7;

export const YieldChartTick = ({ label, centre, plotWidth }: Props) => {
    const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

    const labelWidth = measuredWidth ?? label.length * ESTIMATED_GLYPH_WIDTH;
    const style = { left: clampYieldLabelLeft(centre, labelWidth, 0, plotWidth) };

    const handleLayout = (event: LayoutChangeEvent) => void setMeasuredWidth(event.nativeEvent.layout.width);

    return (
        <Text
            numberOfLines={1}
            maxFontSizeMultiplier={TICK_MAX_FONT_SIZE_MULTIPLIER}
            className="absolute text-[12px] leading-[16px] tabular-nums text-secondary-foreground"
            style={style}
            onLayout={handleLayout}
        >
            {label}
        </Text>
    );
};
