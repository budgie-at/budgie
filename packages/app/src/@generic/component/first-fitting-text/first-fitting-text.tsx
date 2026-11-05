import { useState } from 'react';
import { Text, View } from 'react-native';

import { cn } from '../../utils/cn.util';

import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

interface Props {
    readonly variants: readonly string[];
    readonly className: string;
    readonly testID?: string;
}

export const FirstFittingText = ({ variants, className, testID }: Props) => {
    const [lineCounts, setLineCounts] = useState<Readonly<Record<number, number>>>({});

    const fittingIndex = variants.findIndex((_, index) => lineCounts[index] === 1);
    const shownText = variants.at(fittingIndex) ?? '';

    return (
        <View className="min-w-0 shrink grow">
            <Text className={className} numberOfLines={1} testID={testID}>
                {shownText}
            </Text>
            {variants.map((variant, index) => {
                const handleTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) =>
                    void setLineCounts(counts => ({ ...counts, [index]: event.nativeEvent.lines.length }));

                return (
                    <Text
                        key={variant}
                        aria-hidden
                        pointerEvents="none"
                        className={cn(className, 'absolute inset-x-0 top-0 opacity-0')}
                        onTextLayout={handleTextLayout}
                    >
                        {variant}
                    </Text>
                );
            })}
        </View>
    );
};
