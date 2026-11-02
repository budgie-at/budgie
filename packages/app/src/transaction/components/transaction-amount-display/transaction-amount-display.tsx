import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { cva } from 'class-variance-authority';
import { ReactNode, RefObject, useEffect, useImperativeHandle, useRef } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { ReduceMotion, FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { formatKeypadAmount } from '../../utils/format-keypad-amount.util';

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

const textVariants = cva('text-center font-semibold tabular-nums', {
    variants: {
        variant: { ...FOREGROUND_COLOR_PALETTE, positive: 'text-positive-strong' }
    }
});

const AMOUNT_MIN_HEIGHT = 64;
const BOUNCE_SCALE = 1.04;
const BOUNCE_SPRING = { damping: 12, mass: 0.8, stiffness: 200 };
const RETURN_SPRING = { damping: 15, mass: 1, stiffness: 150 };

export const TransactionAmountDisplay = ({ ref, amount, currencySymbol, variant, topContent, onPress, testID, children }: Props) => {
    const amountContainerStyle = { minHeight: AMOUNT_MIN_HEIGHT * useWindowDimensions().fontScale };
    const { decimalSeparator, digitGroupingSeparator } = useLocaleInfo();
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

    const fullDisplay = `${currencySymbol}${formatKeypadAmount(amount, decimalSeparator, digitGroupingSeparator)}`;

    return (
        <Animated.View entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)} className="items-center self-stretch">
            <View className="min-h-[22px] flex-row items-center justify-center gap-xs self-stretch">{topContent}</View>
            <View className="items-center self-stretch">
                <Pressable
                    className="justify-center self-stretch"
                    style={amountContainerStyle}
                    onPress={onPress}
                    disabled={!isDefined(onPress)}
                >
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
