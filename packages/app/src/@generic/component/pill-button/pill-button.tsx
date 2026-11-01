import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { LoadingContent } from '../loading-content/loading-content';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly isLoading?: boolean;
    readonly isDisabled?: boolean;
    readonly accessibilityHint?: string;
    readonly onPress: () => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

const containerVariants = cva('h-[52px] items-center justify-center rounded-full px-5xl active:opacity-80', {
    variants: { isDisabled: { true: 'bg-surface-fill', false: 'bg-cta-background' } }
});

const labelVariants = cva('text-[17px] font-semibold', {
    variants: { isDisabled: { true: 'text-secondary-foreground', false: 'text-cta-foreground' } }
});

export const PillButton = ({ label, testID, isLoading = false, isDisabled = false, accessibilityHint, onPress }: Props) => {
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
            accessibilityHint={accessibilityHint}
            accessibilityState={accessibilityState}
            testID={testID}
        >
            <LoadingContent isLoading={isLoading}>
                <Text className={labelClassName} numberOfLines={1}>
                    {label}
                </Text>
            </LoadingContent>
        </HapticPressable>
    );
};
