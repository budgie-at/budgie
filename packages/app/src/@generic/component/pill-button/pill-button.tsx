import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { LoadingContent } from '../loading-content/loading-content';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly isLoading?: boolean;
    readonly isDisabled?: boolean;
    readonly onPress: () => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

const containerVariants = cva('min-h-[52px] items-center justify-center rounded-full px-5xl py-md active:opacity-80', {
    variants: { isDisabled: { true: 'bg-cta-background/15', false: 'bg-cta-background' } }
});

const labelVariants = cva('text-center text-[17px] font-semibold', {
    variants: { isDisabled: { true: 'text-primary/40', false: 'text-cta-foreground' } }
});

export const PillButton = ({ label, testID, isLoading = false, isDisabled = false, onPress }: Props) => {
    const containerClassName = containerVariants({ isDisabled });
    const labelClassName = labelVariants({ isDisabled });
    const isInactive = isLoading || isDisabled;
    const accessibilityState = { busy: isLoading, disabled: isDisabled };

    return (
        <HapticPressable
            onPress={onPress}
            disabled={isInactive}
            className={containerClassName}
            style={CONTINUOUS_CORNERS}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={accessibilityState}
            testID={testID}
        >
            <LoadingContent isLoading={isLoading}>
                <Text className={labelClassName}>{label}</Text>
            </LoadingContent>
        </HapticPressable>
    );
};
