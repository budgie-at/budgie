import { cva } from 'class-variance-authority';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { cn } from '../../../@generic/utils/cn.util';
import { PinDotToneEnum } from '../../enum/pin-dot-tone.enum';

interface Props {
    readonly isFilled: boolean;
    readonly isError: boolean;
    readonly isAccepted: boolean;
}

const DOT_SPRING = { damping: 16, stiffness: 420, mass: 0.6 };

const ringVariants = cva('w-[14px] h-[14px] rounded-full border-[1.5px] items-center justify-center', {
    variants: {
        tone: {
            [PinDotToneEnum.DEFAULT]: 'border-secondary-foreground',
            [PinDotToneEnum.ERROR]: 'border-destructive-foreground',
            [PinDotToneEnum.ACCEPTED]: 'border-positive-foreground'
        }
    }
});

const fillVariants = cva('w-[14px] h-[14px] rounded-full', {
    variants: {
        tone: {
            [PinDotToneEnum.DEFAULT]: 'bg-primary',
            [PinDotToneEnum.ERROR]: 'bg-destructive-foreground',
            [PinDotToneEnum.ACCEPTED]: 'bg-positive-foreground'
        }
    }
});

const getTone = (isError: boolean, isAccepted: boolean): PinDotToneEnum => {
    if (isError) {
        return PinDotToneEnum.ERROR;
    }

    return isAccepted ? PinDotToneEnum.ACCEPTED : PinDotToneEnum.DEFAULT;
};

export const PinFormDot = ({ isFilled, isError, isAccepted }: Props) => {
    const fillScale = useSharedValue(isFilled ? 1 : 0);
    const tone = getTone(isError, isAccepted);

    useEffect(() => {
        fillScale.set(withSpring(isFilled ? 1 : 0, DOT_SPRING));
    }, [isFilled, fillScale]);

    const fillStyle = useAnimatedStyle(() => ({
        opacity: fillScale.value,
        transform: [{ scale: fillScale.value }]
    }));

    return (
        <View className={ringVariants({ tone })}>
            <Animated.View className={cn('absolute', fillVariants({ tone }))} style={fillStyle} />
        </View>
    );
};
