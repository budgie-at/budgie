import { Text } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly disabled?: boolean;
    readonly onPress: () => void;
}

export const DatePickerHeaderButton = ({ label, testID, disabled, onPress }: Props) => (
    <HapticPressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="min-h-[44px] min-w-[44px] max-w-[124px] items-center justify-center px-xs"
        testID={testID}
    >
        <Text className="text-primary text-[17px] font-semibold" maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit>
            {label}
        </Text>
    </HapticPressable>
);
