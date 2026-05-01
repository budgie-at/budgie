import { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

const MIN_FONT_SIZE = 24;
const FONT_WIDTH_RATIO = 0.55;

interface UseAutoScaleFontResult {
    fontSize: number;
    onContainerLayout: (event: LayoutChangeEvent) => void;
}

const getFontSize = (text: string, containerWidth: number, baseFontSize: number) => {
    if (!isPositiveNumber(containerWidth) || !isNotEmptyString(text)) {
        return baseFontSize;
    }

    const estimatedTextWidth = text.length * baseFontSize * FONT_WIDTH_RATIO;

    if (estimatedTextWidth > containerWidth) {
        const scale = containerWidth / estimatedTextWidth;

        return Math.max(MIN_FONT_SIZE, Math.floor(baseFontSize * scale));
    }

    return baseFontSize;
};

export const useAutoScaleFont = (baseFontSize: number, text: string): UseAutoScaleFontResult => {
    const [containerWidth, setContainerWidth] = useState(0);

    const onContainerLayout = (event: LayoutChangeEvent) => {
        setContainerWidth(event.nativeEvent.layout.width);
    };

    const fontSize = getFontSize(text, containerWidth, baseFontSize);

    return { fontSize, onContainerLayout };
};
