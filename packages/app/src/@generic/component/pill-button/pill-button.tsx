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
        variant: { primary: 'bg-cta-background', destructive: 'bg-destructive-action' },
        isDisabled: { true: 'opacity-40', false: '' }
    }
});

const labelVariants = cva('text-center text-[17px] font-semibold', {
    variants: { variant: { primary: 'text-cta-foreground', destructive: 'text-white' } }
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
                <Text className={labelVariants({ variant })}>{label}</Text>
            </LoadingContent>
        </HapticPressable>
    );
};
