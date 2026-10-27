import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { cva } from 'class-variance-authority';
import { ReactNode, RefObject, useEffect, useImperativeHandle, useRef } from 'react';
import { Pressable, View } from 'react-native';
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
    readonly topContent?: ReactNode;
    readonly onPress?: () => void;
    readonly testID?: string;
    readonly children?: ReactNode;
}

const textVariants = cva('text-center font-semibold', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

const BOUNCE_SCALE = 1.04;
const BOUNCE_SPRING = { damping: 12, mass: 0.8, stiffness: 200 };
const RETURN_SPRING = { damping: 15, mass: 1, stiffness: 150 };

export const TransactionAmountDisplay = ({ ref, amount, currencySymbol, variant, topContent, onPress, testID, children }: Props) => {
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
            <View className="items-center self-stretch">
                {isDefined(topContent) ? <View className="absolute bottom-full mb-sm items-center z-10">{topContent}</View> : null}
                <Pressable className="self-stretch" onPress={onPress} disabled={!isDefined(onPress)}>
                    <Animated.View style={shakeStyle} className="w-full">
                        <Animated.View style={scaleStyle}>
                            <AmountField fontSize={52}>
                                <AmountFieldText className={textVariants({ variant })} testID={testID}>
                                    {fullDisplay}
                                </AmountFieldText>
                            </AmountField>
                        </Animated.View>
                    </Animated.View>
                </Pressable>
                {children}
            </View>
        </Animated.View>
    );
};
