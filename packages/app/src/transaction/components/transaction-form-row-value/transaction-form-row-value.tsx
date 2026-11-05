import { Text } from 'react-native';

import { isNotEmptyString, isString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';

import type { ReactElement } from 'react';

interface Props {
    readonly value?: string;
    readonly placeholder?: string | ReactElement;
    readonly isStacked: boolean;
    readonly isLargeText: boolean;
    readonly testID?: string;
}

const MAX_FONT_SCALE = 2;
const STACKED_LINES = 3;
const LARGE_TEXT_LINES = 6;

export const TransactionFormRowValue = ({ value, placeholder, isStacked, isLargeText, testID }: Props) => {
    const layoutClassName = isStacked ? '' : 'min-w-0 flex-1 text-right';
    const stackedLineCount = isLargeText ? LARGE_TEXT_LINES : STACKED_LINES;
    const lineCount = isStacked ? stackedLineCount : 1;

    if (!isNotEmptyString(value)) {
        return isString(placeholder) ? (
            <Text
                className={cn('text-[17px] leading-[22px] text-secondary-foreground', layoutClassName)}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                numberOfLines={1}
            >
                {placeholder}
            </Text>
        ) : (
            (placeholder ?? null)
        );
    }

    return (
        <Text
            className={cn('text-[17px] leading-[22px] text-primary', layoutClassName)}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            numberOfLines={lineCount}
            testID={testID}
        >
            {value}
        </Text>
    );
};
