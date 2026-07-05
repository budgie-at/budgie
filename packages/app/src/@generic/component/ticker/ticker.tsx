import { styled } from 'nativewind';
import { ReactNode, useState } from 'react';
import { LayoutChangeEvent, View, type ViewProps } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { calculateOptimalTextSize } from '../../utils/calculate-optimal-text-size.util';
import { cn } from '../../utils/cn.util';

import { StaticChar } from './static-char';
import { Tick } from './tick';

interface Props extends Pick<ViewProps, 'accessible' | 'testID'> {
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
        availableWidth,
        accessible = false,
        testID
    } = props;

    const [containerWidth, setContainerWidth] = useState(0);

    const charArray = number.toString().split('');
    const digitCount = charArray.filter(char => !Number.isNaN(Number.parseFloat(char))).length;
    const resolvedContainerWidth = isDefined(availableWidth) ? availableWidth : containerWidth;

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

    const elements: ReactNode[] = [];
    let digitIndex = 0;

    charArray.forEach((char, index) => {
        const digit = Number.parseFloat(char);

        if (Number.isNaN(digit)) {
            elements.push(
                <StaticCharItem
                    key={`static-${digitCount}-${index}-${char}`}
                    char={char}
                    textSize={textSize}
                    textClassName={textClassName}
                />
            );

            return;
        }

        elements.push(
            <TickItem
                key={`digit-${digitCount}-${digitIndex}`}
                num={digit}
                textSize={textSize}
                textClassName={textClassName}
                index={digitIndex}
                {...(!hasAnimation && { duration: 0, delay: 0 })}
            />
        );
        digitIndex += 1;
    });

    return (
        <View accessible={accessible} className="w-full" testID={testID} {...(!isDefined(availableWidth) && { onLayout: handleLayout })}>
            <View className={cn('flex-row justify-center', className)}>{elements}</View>
        </View>
    );
};
