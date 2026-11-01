import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

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

const containerVariants = cva('min-h-[52px] items-center justify-center rounded-full px-5xl py-md active:opacity-80', {
    variants: {
        variant: { primary: 'bg-cta-background', destructive: '' },
        isDisabled: { true: '', false: '' }
    },
    compoundVariants: [
        { variant: 'primary', isDisabled: true, className: 'opacity-40' },
        { variant: 'destructive', isDisabled: false, className: 'bg-destructive-action' },
        { variant: 'destructive', isDisabled: true, className: 'bg-destructive-action/40' }
    ]
});

const labelVariants = cva('text-center text-[17px] font-semibold', {
    variants: {
        variant: { primary: 'text-cta-foreground', destructive: '' },
        isDisabled: { true: '', false: '' }
    },
    compoundVariants: [
        { variant: 'destructive', isDisabled: false, className: 'text-white' },
        { variant: 'destructive', isDisabled: true, className: 'text-primary/70' }
    ]
});

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

    return (
        <HapticPressable
            onPress={onPress}
            disabled={isInactive}
            className={containerVariants({ variant, isDisabled })}
            style={CONTINUOUS_CORNERS}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            testID={testID}
        >
            <LoadingContent isLoading={isLoading}>
                <Text className={labelVariants({ variant, isDisabled })}>{label}</Text>
            </LoadingContent>
        </HapticPressable>
    );
};
