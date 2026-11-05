import { NativeSyntheticEvent, Text, TextLayoutEventData, View } from 'react-native';

import { isNotEmptyString, isString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';

import type { ReactElement } from 'react';

interface Props {
    readonly value?: string;
    readonly placeholder?: string | ReactElement;
    readonly isStacked: boolean;
    readonly isLargeText: boolean;
    readonly testID?: string;
    readonly onOverflow: (value: string) => void;
}

const MAX_FONT_SCALE = 2;
const INLINE_LINES = 2;
const STACKED_LINES = 3;
const LARGE_TEXT_LINES = 6;

export const TransactionFormRowValue = ({ value, placeholder, isStacked, isLargeText, testID, onOverflow }: Props) => {
    const alignmentClassName = isStacked ? '' : 'text-right';
    const stackedLineCount = isLargeText ? LARGE_TEXT_LINES : STACKED_LINES;
    const lineCount = isStacked ? stackedLineCount : INLINE_LINES;

    const handleMeasureLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
        if (isNotEmptyString(value) && event.nativeEvent.lines.length > INLINE_LINES) {
            onOverflow(value);
        }
    };

    if (!isNotEmptyString(value)) {
        return isString(placeholder) ? (
            <Text
                className={cn('text-[17px] leading-[22px] text-secondary-foreground', !isStacked && 'min-w-0 flex-1 text-right')}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                numberOfLines={1}
            >
                {placeholder}
            </Text>
        ) : (
            (placeholder ?? null)
        );
    }

    const text = (
        <Text
            className={cn('text-[17px] leading-[22px] text-primary', alignmentClassName)}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            numberOfLines={lineCount}
            testID={testID}
        >
            {value}
        </Text>
    );

    if (isStacked) {
        return text;
    }

    return (
        <View className="min-w-0 flex-1">
            {text}
            <Text
                accessible={false}
                importantForAccessibility="no-hide-descendants"
                pointerEvents="none"
                className="absolute top-0 right-0 left-0 text-right text-[17px] leading-[22px] opacity-0"
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                onTextLayout={handleMeasureLayout}
            >
                {value}
            </Text>
        </View>
    );
};
