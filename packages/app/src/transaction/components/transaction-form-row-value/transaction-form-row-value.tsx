import { Text, View } from 'react-native';

import { isNotEmptyString, isString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';

import type { ReactElement } from 'react';

interface Props {
    readonly value?: string;
    readonly placeholder?: string | ReactElement;
    readonly isStacked: boolean;
    readonly isLargeText: boolean;
    readonly testID?: string;
    readonly numberOfLines?: number;
}

const MAX_FONT_SCALE = 2;
const INLINE_LINES = 1;
const STACKED_LINES = 3;
const LARGE_TEXT_LINES = 0;

export const TransactionFormRowValue = ({ value, placeholder, isStacked, isLargeText, testID, numberOfLines }: Props) => {
    const alignmentClassName = isStacked ? '' : 'text-right';
    const stackedLineCount = isLargeText ? LARGE_TEXT_LINES : STACKED_LINES;
    const lineCount = numberOfLines ?? (isStacked ? stackedLineCount : INLINE_LINES);

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
            ellipsizeMode="tail"
            testID={testID}
        >
            {value}
        </Text>
    );

    if (isStacked) {
        return text;
    }

    return <View className="min-w-0 flex-1">{text}</View>;
};
