import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/row-max-font-size-multiplier.constant';
import { cn } from '../../utils/cn.util';
import { joinWithMiddot } from '../../utils/join-with-middot.util';

import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

interface Props {
    readonly segments: readonly string[];
    readonly className?: string;
    readonly testID?: string;
}

const NO_BREAK_SPACE = ' ';
const TRAILING_SEPARATOR = /[\s ]*·[\s ]*$/u;
const SEPARATOR = ' · ';
const NO_BREAK_SEPARATOR = ' · ';
const detailVariants = cva('text-[13px] leading-[18px] text-secondary-foreground tabular-nums');

export const ListRowDetail = ({ segments, className, testID }: Props) => {
    const [layout, setLayout] = useState<{ readonly text: string; readonly lines: readonly string[] } | null>(null);

    const text = joinWithMiddot(segments.map(segment => segment.replaceAll(' ', NO_BREAK_SPACE))).replaceAll(SEPARATOR, NO_BREAK_SEPARATOR);
    const textClassName = cn(detailVariants(), className);
    const brokenLines = layout?.text === text && layout.lines.length > 1 ? layout.lines : null;

    const handleTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
        const lines = event.nativeEvent.lines.map(line => line.text.replace(TRAILING_SEPARATOR, '').trim());

        if ((lines.length > 1 || isDefined(brokenLines)) && (layout?.text !== text || layout.lines.join('\n') !== lines.join('\n'))) {
            setLayout({ text, lines });
        }
    };

    return (
        <View accessible accessibilityLabel={segments.join(', ')} testID={testID}>
            {brokenLines?.map(line => (
                <Text key={line} className={textClassName} maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
                    {line}
                </Text>
            ))}
            <Text
                className={cn(textClassName, brokenLines && 'absolute inset-x-0 opacity-0')}
                accessible={false}
                maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                onTextLayout={handleTextLayout}
            >
                {text}
            </Text>
        </View>
    );
};
