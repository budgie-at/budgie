import { styled } from 'nativewind';
import { ReactNode, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { calculateOptimalTextSize } from '../../utils/calculate-optimal-text-size.util';

import { StaticChar } from './static-char';
import { Tick } from './tick';

interface Props {
    readonly number: number | string;
    readonly textClassName?: string;
    readonly minFontSize?: number;
    readonly maxFontSize?: number;
    readonly fontSize?: number;
}

const TickItem = styled(Tick, { textClassName: 'textStyle' });
const StaticCharItem = styled(StaticChar, { textClassName: 'textStyle' });

export const Ticker = ({ number, textClassName, fontSize = 24, minFontSize = 10, maxFontSize = 200 }: Props) => {
    const [containerWidth, setContainerWidth] = useState(0);

    const charArray = number.toString().split('');

    const textSize = calculateOptimalTextSize({
        minFontSize,
        maxFontSize,
        containerWidth,
        defaultSize: fontSize,
        charCount: charArray.length
    });

    const handleLayout = (event: LayoutChangeEvent): void => {
        setContainerWidth(event.nativeEvent.layout.width);
    };

    const { elements } = charArray.reduce<{ elements: ReactNode[]; digitIndex: number }>(
        (acc, char, index) => {
            if (!isNaN(parseFloat(char))) {
                return {
                    digitIndex: acc.digitIndex + 1,
                    elements: [
                        ...acc.elements,
                        <TickItem
                            key={index}
                            num={parseFloat(char)}
                            textSize={textSize}
                            textClassName={textClassName}
                            index={acc.digitIndex}
                        />
                    ]
                };
            }

            return {
                digitIndex: acc.digitIndex,
                elements: [...acc.elements, <StaticCharItem key={index} char={char} textSize={textSize} textClassName={textClassName} />]
            };
        },
        { elements: [], digitIndex: 0 }
    );

    return (
        <View className="w-full" onLayout={handleLayout}>
            <View className="flex-row justify-center">{elements}</View>
        </View>
    );
};
