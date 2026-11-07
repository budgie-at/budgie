import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { type ClassValue } from 'cn';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { TRANSACTION_KEYPAD_MAX_FONT_SCALE } from '../../constant/transaction-keypad-max-font-scale.constant';

type KeypadButtonVariant = 'digit' | 'action';

interface Props {
    readonly value?: string;
    readonly icon?: UserIconNameEnum;
    readonly variant?: KeypadButtonVariant;
    readonly accessibilityLabel?: string;
    readonly onPress: () => void;
    readonly onLongPress?: () => void;
    readonly testID?: string;
}

const ICON_SIZE = 24;
const COMMA_GLYPH_STYLE = { transform: [{ translateY: -6 }] };

const buttonVariants = cva<{
    buttonVariant: Record<KeypadButtonVariant, ClassValue>;
}>('min-h-[44px] items-center justify-center rounded-xl', {
    variants: {
        buttonVariant: {
            digit: 'flex-1 bg-grouped-surface-fill active:bg-surface-fill',
            action: 'flex-1 bg-grouped-surface-fill active:bg-surface-fill'
        }
    },
    defaultVariants: { buttonVariant: 'digit' }
});

const textVariants = cva<{
    buttonVariant: Record<KeypadButtonVariant, ClassValue>;
}>('text-2xl font-semibold tabular-nums', {
    variants: {
        buttonVariant: {
            digit: 'text-primary',
            action: 'text-secondary-foreground'
        }
    },
    defaultVariants: { buttonVariant: 'digit' }
});

export const TransactionKeypadButton = (props: Props) => {
    const { value, icon, variant = 'digit', accessibilityLabel, onPress, onLongPress, testID } = props;

    const resolvedAccessibilityLabel = accessibilityLabel ?? value ?? icon;
    const glyphStyle = value === ',' ? COMMA_GLYPH_STYLE : void 0;
    const pressFeedback = variant === 'digit' ? HapticPressFeedbackEnum.SELECTION : HapticPressFeedbackEnum.IMPACT;
    const contentClassName = textVariants({ buttonVariant: variant });

    return (
        <HapticPressable
            accessibilityLabel={resolvedAccessibilityLabel}
            accessibilityRole="button"
            className={buttonVariants({ buttonVariant: variant })}
            onLongPress={onLongPress}
            onPress={onPress}
            pressFeedback={pressFeedback}
            testID={testID}
        >
            <View className="items-center justify-center" collapsable={false}>
                {isDefined(icon) ? (
                    <Icon className={contentClassName} icon={icon} size={ICON_SIZE} />
                ) : (
                    <Text className={contentClassName} style={glyphStyle} maxFontSizeMultiplier={TRANSACTION_KEYPAD_MAX_FONT_SCALE}>
                        {value}
                    </Text>
                )}
            </View>
        </HapticPressable>
    );
};
