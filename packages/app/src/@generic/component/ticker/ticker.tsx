import { styled } from 'nativewind';
import { ReactNode, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { calculateOptimalTextSize } from '../../utils/calculate-optimal-text-size.util';
import { cn } from '../../utils/cn.util';

import { StaticChar } from './static-char';
import { Tick } from './tick';

interface Props {
    readonly number: number | string;
    readonly textClassName?: string;
    readonly minFontSize?: number;
    readonly maxFontSize?: number;
    readonly className?: string;
    readonly fontSize?: number;
    readonly hasAnimation?: boolean;
    readonly availableWidth?: number;
}

const TickItem = styled(Tick, { textClassName: 'textStyle' });
const StaticCharItem = styled(StaticChar, { textClassName: 'textStyle' });

export const Ticker = (props: Props) => {
    const {
        number,
        textClassName,
        className,
        fontSize = 24,
        minFontSize = 10,
        maxFontSize = 200,
        hasAnimation = true,
        availableWidth
    } = props;

    const [containerWidth, setContainerWidth] = useState(0);

    const charArray = number.toString().split('');
    const resolvedContainerWidth = availableWidth ?? containerWidth;

    const textSize = calculateOptimalTextSize({
        minFontSize,
        maxFontSize,
        containerWidth: resolvedContainerWidth,
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
                            {...(!hasAnimation && { duration: 0, delay: 0 })}
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
        <View className="w-full" {...(!availableWidth && { onLayout: handleLayout })}>
            <View className={cn('flex-row justify-center', className)}>{elements}</View>
        </View>
    );
};
