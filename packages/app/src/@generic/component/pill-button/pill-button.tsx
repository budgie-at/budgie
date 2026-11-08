import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../constant/max-chrome-font-size-multiplier.constant';
import { BUTTON_PRESSED_SCALE } from '../../constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../enum/haptic-press-feedback.enum';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { LoadingContent } from '../loading-content/loading-content';

type PillButtonVariant = 'primary' | 'destructive';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly isLoading?: boolean;
    readonly isDisabled?: boolean;
    readonly variant?: PillButtonVariant;
    readonly accessibilityLabel?: string;
    readonly onPress: () => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

const containerVariants = cva('min-h-[52px] items-center justify-center rounded-xl px-5xl py-md active:opacity-80', {
    variants: {
        variant: { primary: '', destructive: '' },
        isDisabled: { true: '', false: '' }
    },
    compoundVariants: [
        { variant: 'primary', isDisabled: false, className: 'bg-positive-action' },
        { variant: 'primary', isDisabled: true, className: 'bg-cta-disabled-background' },
        { variant: 'destructive', isDisabled: false, className: 'bg-destructive-action' },
        { variant: 'destructive', isDisabled: true, className: 'bg-destructive-action/40' }
    ]
});

const labelVariants = cva('text-center text-[17px] font-semibold', {
    variants: {
        variant: { primary: '', destructive: '' },
        isDisabled: { true: '', false: '' }
    },
    compoundVariants: [
        { variant: 'primary', isDisabled: false, className: 'text-positive-action-foreground' },
        { variant: 'primary', isDisabled: true, className: 'text-secondary-foreground' },
        { variant: 'destructive', isDisabled: false, className: 'text-white' },
        { variant: 'destructive', isDisabled: true, className: 'text-primary/70' }
    ]
});

const PRESS_FEEDBACK: Record<PillButtonVariant, HapticPressFeedbackEnum> = {
    primary: HapticPressFeedbackEnum.COMMIT,
    destructive: HapticPressFeedbackEnum.DESTRUCTIVE
};

export const PillButton = ({
    label,
    testID,
    isLoading = false,
    isDisabled = false,
    variant = 'primary',
    accessibilityLabel = label,
    onPress
}: Props) => {
    const isInactive = isLoading || isDisabled;
    const accessibilityState = { busy: isLoading, disabled: isDisabled };
    const pressFeedback = PRESS_FEEDBACK[variant];

    return (
        <HapticPressable
            pressedScale={BUTTON_PRESSED_SCALE}
            onPress={onPress}
            disabled={isInactive}
            pressFeedback={pressFeedback}
            className={containerVariants({ variant, isDisabled })}
            style={CONTINUOUS_CORNERS}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            testID={testID}
        >
            <LoadingContent isLoading={isLoading}>
                <Text maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER} className={labelVariants({ variant, isDisabled })}>
                    {label}
                </Text>
            </LoadingContent>
        </HapticPressable>
    );
};
