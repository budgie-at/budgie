import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { RefObject, useImperativeHandle, useState } from 'react';
import { LayoutChangeEvent, NativeSyntheticEvent, Pressable, TextLayoutEventData, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
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
    readonly onPress?: () => void;
    readonly testID?: string;
    readonly accessoryIcon?: UserIconNameEnum;
    readonly accessibilityHint?: string;
}

const textVariants = cva('text-center font-semibold tabular-nums', {
    variants: {
        variant: { ...FOREGROUND_COLOR_PALETTE, positive: 'text-positive-strong' }
    }
});

const AMOUNT_MIN_HEIGHT = 56;
const MAX_AMOUNT_FONT_SCALE = 1.35;
const ACCESSORY_GAP = 6;
export const TransactionAmountDisplay = ({
    ref,
    amount,
    currencySymbol,
    variant,
    onPress,
    testID,
    accessoryIcon,
    accessibilityHint
}: Props) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const [textWidth, setTextWidth] = useState(0);
    const isAmountProtected = useIsAmountProtected();
    const amountContainerStyle = { minHeight: AMOUNT_MIN_HEIGHT * Math.min(useWindowDimensions().fontScale, MAX_AMOUNT_FONT_SCALE) };
    const { decimalSeparator, digitGroupingSeparator } = useLocaleInfo();
    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const handleContainerLayout = (event: LayoutChangeEvent) => void setContainerWidth(event.nativeEvent.layout.width);
    const handleTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) =>
        void setTextWidth(event.nativeEvent.lines.at(0)?.width ?? 0);

    const displaySymbol = variant === 'positive' && !currencySymbol.startsWith('+') ? `+${currencySymbol}` : currencySymbol;
    const fullDisplay = isAmountProtected
        ? PROTECTED_AMOUNT_PLACEHOLDER
        : `${displaySymbol}${formatKeypadAmount(amount, decimalSeparator, digitGroupingSeparator)}`;

    const accessoryStyle = {
        left: (containerWidth + textWidth) / 2 + ACCESSORY_GAP,
        opacity: containerWidth > 0 && textWidth > 0 ? 1 : 0
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
                        className={textVariants({ variant })}
                        onTextLayout={handleTextLayout}
                    >
                        {fullDisplay}
                    </AmountFieldText>
                </AmountField>
                {isDefined(accessoryIcon) ? (
                    <View
                        pointerEvents="none"
                        className="absolute top-0 bottom-0 w-[28px] items-center justify-center"
                        style={accessoryStyle}
                    >
                        <Icon icon={accessoryIcon} size={18} className="text-secondary-foreground" />
                    </View>
                ) : null}
            </Animated.View>
        </Pressable>
    );
};
