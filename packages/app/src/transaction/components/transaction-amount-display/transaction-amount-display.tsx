import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { cva } from 'class-variance-authority';
import { RefObject, useImperativeHandle, useState } from 'react';
import { LayoutChangeEvent, NativeSyntheticEvent, Pressable, TextLayoutEventData, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { formatKeypadAmount } from '../../utils/format-keypad-amount.util';
import { AmountCaret } from '../amount-caret/amount-caret';

export interface TransactionAmountDisplayRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionAmountDisplayRef | null>;
    readonly amount: string;
    readonly currencySymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly onPress?: () => void;
    readonly testID?: string;
    readonly isEditing: boolean;
    readonly accessibilityHint?: string;
}

const textVariants = cva('text-center font-semibold tabular-nums', {
    variants: {
        variant: { ...FOREGROUND_COLOR_PALETTE, positive: 'text-positive-strong' }
    }
});

const AMOUNT_MIN_HEIGHT = 56;
const MAX_AMOUNT_FONT_SCALE = 1.35;
const CARET_GAP = 2;
const CARET_HEIGHT_RATIO = 0.72;
export const TransactionAmountDisplay = ({
    ref,
    amount,
    currencySymbol,
    variant,
    onPress,
    testID,
    isEditing,
    accessibilityHint
}: Props) => {
    const [textLayout, setTextLayout] = useState({ containerWidth: 0, width: 0, height: 0 });
    const isAmountProtected = useIsAmountProtected();
    const amountContainerStyle = { minHeight: AMOUNT_MIN_HEIGHT * Math.min(useWindowDimensions().fontScale, MAX_AMOUNT_FONT_SCALE) };
    const { decimalSeparator, digitGroupingSeparator } = useLocaleInfo();
    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const handleContainerLayout = (event: LayoutChangeEvent) =>
        void setTextLayout(previous => ({ ...previous, containerWidth: event.nativeEvent.layout.width }));
    const handleTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) =>
        void setTextLayout(previous => ({
            ...previous,
            width: event.nativeEvent.lines.at(0)?.width ?? 0,
            height: event.nativeEvent.lines.at(0)?.height ?? 0
        }));

    const displaySymbol = variant === 'positive' && !currencySymbol.startsWith('+') ? `+${currencySymbol}` : currencySymbol;
    const fullDisplay = isAmountProtected
        ? PROTECTED_AMOUNT_PLACEHOLDER
        : `${displaySymbol}${formatKeypadAmount(amount, decimalSeparator, digitGroupingSeparator)}`;

    const amountClassName = cn(textVariants({ variant }), !isPositiveNumber(Number(amount)) && 'text-secondary-foreground');
    const caretHeight = textLayout.height * CARET_HEIGHT_RATIO;
    const accessoryStyle = {
        left: (textLayout.containerWidth + textLayout.width) / 2 + CARET_GAP,
        opacity: textLayout.containerWidth > 0 && textLayout.width > 0 ? 1 : 0
    };

    return (
        <Pressable
            className="justify-center self-stretch px-[34px]"
            style={amountContainerStyle}
            onPress={onPress}
            disabled={!isDefined(onPress)}
            accessibilityRole="button"
            accessibilityLabel={fullDisplay}
            accessibilityHint={accessibilityHint}
            testID={testID}
        >
            <Animated.View style={shakeStyle} onLayout={handleContainerLayout}>
                <AmountField fontSize={40}>
                    <AmountFieldText
                        maxFontSizeMultiplier={MAX_AMOUNT_FONT_SCALE}
                        className={amountClassName}
                        onTextLayout={handleTextLayout}
                    >
                        {fullDisplay}
                    </AmountFieldText>
                </AmountField>
                <View pointerEvents="none" className="absolute top-0 bottom-0 justify-center" style={accessoryStyle}>
                    {isEditing ? <AmountCaret height={caretHeight} /> : null}
                </View>
            </Animated.View>
        </Pressable>
    );
};
