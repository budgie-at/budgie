import { Text } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly disabled?: boolean;
}

export const SheetHeaderAction = ({ label, onPress, testID, disabled = false }: Props) => {
    const accessibilityState = { disabled };
    const className = disabled
        ? 'min-h-[44px] min-w-[44px] items-center justify-center px-xs opacity-35'
        : 'min-h-[44px] min-w-[44px] items-center justify-center px-xs active:opacity-60';

    return (
        <HapticPressable
            onPress={onPress}
            disabled={disabled}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={accessibilityState}
            className={className}
        >
            <Text className="text-[15px] font-semibold text-positive-action" maxFontSizeMultiplier={1.35} numberOfLines={1}>
                {label}
            </Text>
        </HapticPressable>
    );
};
