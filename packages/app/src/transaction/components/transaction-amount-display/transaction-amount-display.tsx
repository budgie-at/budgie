import { cva } from 'class-variance-authority';
import { RefObject, useEffect, useImperativeHandle, useRef } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { CurrencyModePill } from '../currency-mode-pill/currency-mode-pill';

export interface TransactionAmountDisplayRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionAmountDisplayRef | null>;
    readonly amount: string;
    readonly currencySymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly label?: string | null;
    readonly isLabelFlipped?: boolean;
    readonly secondaryAmount?: string | null;
    readonly onLabelPress?: () => void;
    readonly onSecondaryAmountPress?: () => void;
    readonly testID?: string;
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

const SECONDARY_ANIMATION_DELAY = 50;
const SECONDARY_ANIMATION_DURATION = 200;
const SECONDARY_ENTERING_ANIMATION = FadeInDown.delay(SECONDARY_ANIMATION_DELAY).duration(SECONDARY_ANIMATION_DURATION);

export const TransactionAmountDisplay = ({
    ref,
    amount,
    currencySymbol,
    variant,
    label,
    isLabelFlipped = false,
    onLabelPress,
    secondaryAmount,
    onSecondaryAmountPress,
    testID
}: Props) => {
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
        <Animated.View testID={testID} entering={FadeIn.duration(200)} className="items-center">
            <Pressable onPress={onSecondaryAmountPress} disabled={!isDefined(onSecondaryAmountPress)}>
                <Animated.View style={shakeStyle} className="w-full">
                    <Animated.View style={scaleStyle}>
                        <Text className={textVariants({ variant })} style={fontSizeStyle} adjustsFontSizeToFit numberOfLines={1}>
                            {fullDisplay}
                        </Text>
                    </Animated.View>
                </Animated.View>
            </Pressable>
            {isDefined(label) ? <CurrencyModePill label={label} isFlipped={isLabelFlipped} onPress={onLabelPress} /> : null}
            {isDefined(secondaryAmount) ? (
                <Pressable onPress={onSecondaryAmountPress} disabled={!isDefined(onSecondaryAmountPress)}>
                    <Animated.Text entering={SECONDARY_ENTERING_ANIMATION} className="text-lg text-secondary-foreground font-medium mt-xs">
                        {secondaryAmount}
                    </Animated.Text>
                </Pressable>
            ) : null}
        </Animated.View>
    );
};
