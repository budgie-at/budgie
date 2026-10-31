import { Text } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly onPress: () => void;
}

export const StatsSectionToggleRow = ({ label, testID, onPress }: Props) => (
    <HapticPressable
        accessibilityRole="button"
        className="min-h-[44px] justify-center py-md pr-xl pl-[60px] active:scale-100 active:bg-surface-fill"
        hitSlop={0}
        testID={testID}
        onPress={onPress}
    >
        <Text className="text-[15px] text-default-foreground">{label}</Text>
    </HapticPressable>
);
