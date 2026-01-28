import { cva } from 'class-variance-authority';
import { RefObject, useEffect, useImperativeHandle, useRef } from 'react';
import { Text } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

export interface TransactionAmountDisplayRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionAmountDisplayRef | null>;
    readonly amount: string;
    readonly currencySymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly label?: string;
}

const textVariants = cva('text-center font-semibold', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

const BOUNCE_SCALE = 1.04;
const BOUNCE_SPRING = { damping: 12, mass: 0.8, stiffness: 200 };
const RETURN_SPRING = { damping: 15, mass: 1, stiffness: 150 };
const FONT_SIZE = 52;
const fontSizeStyle = { fontSize: FONT_SIZE };

export const TransactionAmountDisplay = ({ ref, amount, currencySymbol, variant, label }: Props) => {
    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();
    const scale = useSharedValue(1);
    const previousAmount = useRef(amount);

    useImperativeHandle(ref, () => ({ shake }));

    useEffect(() => {
        if (amount !== previousAmount.current) {
            scale.set(
                withSpring(BOUNCE_SCALE, BOUNCE_SPRING, finished => {
                    if (finished) {
                        scale.set(withSpring(1, RETURN_SPRING));
                    }
                })
            );
            previousAmount.current = amount;
        }
    }, [amount, scale]);

    const scaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const fullDisplay = `${currencySymbol} ${amount}`;

    return (
        <Animated.View entering={FadeIn.duration(200)} className="flex-1 items-center justify-center">
            <Animated.View style={shakeStyle} className="w-full">
                <Animated.View style={scaleStyle}>
                    <Text className={textVariants({ variant })} style={fontSizeStyle} adjustsFontSizeToFit numberOfLines={1}>
                        {fullDisplay}
                    </Text>
                </Animated.View>
            </Animated.View>
            {isDefined(label) ? <Text className="text-xs text-secondary-foreground uppercase mt-sm">{label}</Text> : null}
        </Animated.View>
    );
};
