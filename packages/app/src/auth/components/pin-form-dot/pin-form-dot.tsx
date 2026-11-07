import { cva } from 'class-variance-authority';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EASE_OUT } from '../../../@generic/constant/motion.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { PinDotToneEnum } from '../../enum/pin-dot-tone.enum';

interface Props {
    readonly isFilled: boolean;
    readonly isError: boolean;
    readonly isAccepted: boolean;
}

const DOT_FILL_DURATION = 140;
const DOT_UNFILL_DURATION = 100;
const DOT_MIN_SCALE = 0.6;

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
    const progress = useSharedValue(isFilled ? 1 : 0);
    const tone = getTone(isError, isAccepted);

    useEffect(() => {
        const duration = isFilled ? DOT_FILL_DURATION : DOT_UNFILL_DURATION;

        progress.set(withTiming(isFilled ? 1 : 0, { duration, easing: EASE_OUT }));
    }, [isFilled, progress]);

    const fillStyle = useAnimatedStyle(() => ({
        opacity: progress.get(),
        transform: [{ scale: interpolate(progress.get(), [0, 1], [DOT_MIN_SCALE, 1]) }]
    }));

    return (
        <View className={ringVariants({ tone })}>
            <Animated.View className={cn('absolute', fillVariants({ tone }))} style={fillStyle} />
        </View>
    );
};
